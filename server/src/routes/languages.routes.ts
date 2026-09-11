import { Router } from 'express';
import { prisma } from '../db';
import { requireAuth } from '../middleware/requireAuth';
import { requirePermission } from '../middleware/requirePermission';
import { asyncHandler } from '../middleware/errorHandler';
import { ApiError } from '../lib/ApiError';

export const languagesRouter = Router();

languagesRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const items = await prisma.language.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    res.json({ items });
  })
);

languagesRouter.get(
  '/admin',
  requireAuth,
  requirePermission('languages', 'view'),
  asyncHandler(async (_req, res) => {
    const items = await prisma.language.findMany({ orderBy: { sortOrder: 'asc' } });
    res.json({ items });
  })
);

languagesRouter.post(
  '/',
  requireAuth,
  requirePermission('languages', 'create'),
  asyncHandler(async (req, res) => {
    const item = await prisma.language.create({ data: req.body });
    res.status(201).json({ item });
  })
);

languagesRouter.patch(
  '/:id',
  requireAuth,
  requirePermission('languages', 'edit'),
  asyncHandler(async (req, res) => {
    // Only one language can be the fallback/default at a time.
    if (req.body.isDefault === true) {
      await prisma.language.updateMany({ where: { isDefault: true }, data: { isDefault: false } });
    }
    const item = await prisma.language.update({ where: { id: req.params.id }, data: req.body });
    res.json({ item });
  })
);

languagesRouter.delete(
  '/:id',
  requireAuth,
  requirePermission('languages', 'delete'),
  asyncHandler(async (req, res) => {
    const language = await prisma.language.findUnique({ where: { id: req.params.id } });
    if (!language) throw new ApiError(404, 'Til topilmadi');
    if (language.isDefault) throw new ApiError(400, "Standart (fallback) tilni o'chirib bo'lmaydi");
    await prisma.language.delete({ where: { id: req.params.id } });
    res.status(204).end();
  })
);
