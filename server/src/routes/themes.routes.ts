import { Router } from 'express';
import { prisma } from '../db';
import { requireAuth } from '../middleware/requireAuth';
import { requirePermission } from '../middleware/requirePermission';
import { asyncHandler } from '../middleware/errorHandler';
import { ApiError } from '../lib/ApiError';

export const themesRouter = Router();

themesRouter.get(
  '/active',
  asyncHandler(async (_req, res) => {
    const theme = await prisma.theme.findFirst({ where: { isActive: true } });
    res.json({ item: theme });
  })
);

// Themes carry no sensitive data (just colors/typography JSON) — the full list is
// public because the storefront's ThemeProvider needs it to resolve the active theme.
themesRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const themes = await prisma.theme.findMany({ orderBy: { name: 'asc' } });
    res.json({ items: themes });
  })
);

themesRouter.post(
  '/',
  requireAuth,
  requirePermission('themes', 'create'),
  asyncHandler(async (req, res) => {
    const theme = await prisma.theme.create({ data: req.body });
    res.status(201).json({ item: theme });
  })
);

themesRouter.patch(
  '/:id',
  requireAuth,
  requirePermission('themes', 'edit'),
  asyncHandler(async (req, res) => {
    const theme = await prisma.theme.update({ where: { id: req.params.id }, data: req.body });
    res.json({ item: theme });
  })
);

themesRouter.delete(
  '/:id',
  requireAuth,
  requirePermission('themes', 'delete'),
  asyncHandler(async (req, res) => {
    await prisma.theme.delete({ where: { id: req.params.id } });
    res.status(204).end();
  })
);

themesRouter.post(
  '/:id/activate',
  requireAuth,
  requirePermission('themes', 'edit'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const theme = await prisma.theme.findUnique({ where: { id } });
    if (!theme) throw new ApiError(404, 'Mavzu topilmadi');

    await prisma.$transaction([
      prisma.theme.updateMany({ where: { isActive: true }, data: { isActive: false } }),
      prisma.theme.update({ where: { id }, data: { isActive: true } }),
    ]);

    res.status(204).end();
  })
);
