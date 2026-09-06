import { Router } from 'express';
import { prisma } from '../db';
import { requireAuth } from '../middleware/requireAuth';
import { requirePermission } from '../middleware/requirePermission';
import { asyncHandler } from '../middleware/errorHandler';

export const systemSettingsRouter = Router();

systemSettingsRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const row = await prisma.systemSettings.findFirst();
    res.json({ item: row });
  })
);

systemSettingsRouter.patch(
  '/',
  requireAuth,
  requirePermission('systemSettings', 'edit'),
  asyncHandler(async (req, res) => {
    const existing = await prisma.systemSettings.findFirst();
    const row = existing
      ? await prisma.systemSettings.update({ where: { id: existing.id }, data: req.body })
      : await prisma.systemSettings.create({ data: req.body });
    res.json({ item: row });
  })
);
