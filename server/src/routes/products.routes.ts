import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../db';
import { optionalAuth } from '../middleware/optionalAuth';
import { requireAuth } from '../middleware/requireAuth';
import { requirePermission } from '../middleware/requirePermission';
import { asyncHandler } from '../middleware/errorHandler';

export const productsRouter = Router();

function toArray(value: unknown): string[] | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (Array.isArray(value)) return value.map(String);
  return String(value)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function toBool(value: unknown): boolean | undefined {
  if (value === undefined) return undefined;
  return value === 'true' || value === '1' || value === true;
}

function toNumber(value: unknown): number | undefined {
  if (value === undefined || value === '') return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

productsRouter.get(
  '/filter-options',
  asyncHandler(async (_req, res) => {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: { materials: true, colors: true, furLength: true, application: true, price: true },
    });

    const materials = new Set<string>();
    const colors = new Set<string>();
    const furLengths = new Set<string>();
    const applications = new Set<string>();
    let maxPrice = 0;

    for (const p of products) {
      p.materials.forEach((m) => materials.add(m));
      p.colors.forEach((c) => colors.add(c));
      p.furLength.forEach((f) => furLengths.add(f));
      p.application.forEach((a) => applications.add(a));
      if (p.price && p.price > maxPrice) maxPrice = p.price;
    }

    res.json({
      materials: [...materials],
      colors: [...colors],
      furLengths: [...furLengths],
      applications: [...applications],
      maxPrice: Math.ceil(maxPrice / 100000) * 100000,
    });
  })
);

productsRouter.get(
  '/featured',
  asyncHandler(async (_req, res) => {
    const items = await prisma.product.findMany({
      where: { isActive: true, isFeatured: true },
      orderBy: { sortOrder: 'asc' },
    });
    res.json({ items });
  })
);

productsRouter.get(
  '/',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const q = req.query;
    const page = Math.max(1, Number(q.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(q.pageSize) || 20));

    const materials = toArray(q.materials);
    const colors = toArray(q.colors);
    const furLengths = toArray(q.furLengths);
    const applications = toArray(q.applications);
    const categoryIds = toArray(q.categoryIds);
    const productIds = toArray(q.productIds);
    const priceMin = toNumber(q.priceMin);
    const priceMax = toNumber(q.priceMax);
    const inStock = toBool(q.inStock);
    const isFeatured = toBool(q.isFeatured);
    const showInDiscountBanner = toBool(q.showInDiscountBanner);
    const discounted = toBool(q.discounted);
    const search = typeof q.search === 'string' && q.search.trim() ? q.search.trim() : undefined;

    // Only an authenticated admin-panel user may request inactive products or bypass the
    // active-only default entirely (e.g. admin product list / per-category product counts).
    const requestedIsActive = toBool(q.isActive);
    const bypassActiveFilter = !!req.user && toBool(q.all) === true;
    const isActive = bypassActiveFilter
      ? undefined
      : req.user && requestedIsActive === false
        ? false
        : requestedIsActive === undefined
          ? true
          : requestedIsActive;

    const where: Prisma.ProductWhereInput = isActive === undefined ? {} : { isActive };
    const and: Prisma.ProductWhereInput[] = [];

    if (q.categoryId && typeof q.categoryId === 'string') where.categoryId = q.categoryId;
    if (categoryIds?.length) where.categoryId = { in: categoryIds };
    if (productIds?.length) where.id = { in: productIds };
    // Price filters include products with no price set (e.g. negotiable-price items),
    // matching the original PostgREST `.or(price.gte.X,price.is.null)` behavior.
    if (priceMin !== undefined && priceMax !== undefined) {
      and.push({ OR: [{ AND: [{ price: { gte: priceMin } }, { price: { lte: priceMax } }] }, { price: null }] });
    } else if (priceMin !== undefined) {
      and.push({ OR: [{ price: { gte: priceMin } }, { price: null }] });
    } else if (priceMax !== undefined) {
      and.push({ OR: [{ price: { lte: priceMax } }, { price: null }] });
    }
    if (materials?.length) where.materials = { hasSome: materials };
    if (colors?.length) where.colors = { hasSome: colors };
    if (furLengths?.length) where.furLength = { hasSome: furLengths };
    if (applications?.length) where.application = { hasSome: applications };
    if (inStock !== undefined) where.inStock = inStock;
    if (isFeatured !== undefined) where.isFeatured = isFeatured;
    if (showInDiscountBanner !== undefined) where.showInDiscountBanner = showInDiscountBanner;
    if (typeof q.promoTileId === 'string') where.promoTileIds = { has: q.promoTileId };
    if (search) {
      and.push({
        OR: [
          { nameUz: { contains: search, mode: 'insensitive' } },
          { nameRu: { contains: search, mode: 'insensitive' } },
          { descriptionUz: { contains: search, mode: 'insensitive' } },
          { descriptionRu: { contains: search, mode: 'insensitive' } },
        ],
      });
    }
    if (and.length) where.AND = and;

    if (discounted) {
      const rows = await prisma.$queryRaw<{ id: string }[]>`
        SELECT id FROM products WHERE original_price IS NOT NULL AND original_price > price
      `;
      const discountedIds = rows.map((r) => r.id);
      where.id = where.id ? { in: (where.id as { in: string[] }).in.filter((id) => discountedIds.includes(id)) } : { in: discountedIds };
    }

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.product.count({ where }),
    ]);

    res.json({ items, total, page, pageSize });
  })
);

productsRouter.get(
  '/:idOrSlug',
  asyncHandler(async (req, res) => {
    const { idOrSlug } = req.params;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
    const item = isUuid
      ? await prisma.product.findUnique({ where: { id: idOrSlug } })
      : await prisma.product.findUnique({ where: { slug: idOrSlug } });
    if (!item) return res.status(404).json({ error: 'Mahsulot topilmadi' });
    res.json({ item });
  })
);

productsRouter.post(
  '/',
  requireAuth,
  requirePermission('products', 'create'),
  asyncHandler(async (req, res) => {
    const item = await prisma.product.create({ data: req.body });
    res.status(201).json({ item });
  })
);

productsRouter.patch(
  '/:id',
  requireAuth,
  requirePermission('products', 'edit'),
  asyncHandler(async (req, res) => {
    const item = await prisma.product.update({ where: { id: req.params.id }, data: req.body });
    res.json({ item });
  })
);

productsRouter.delete(
  '/:id',
  requireAuth,
  requirePermission('products', 'delete'),
  asyncHandler(async (req, res) => {
    await prisma.product.delete({ where: { id: req.params.id } });
    res.status(204).end();
  })
);
