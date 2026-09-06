import { Router } from 'express';
import { prisma } from '../db';
import { requireAuth } from '../middleware/requireAuth';
import { requirePermission } from '../middleware/requirePermission';
import { asyncHandler } from '../middleware/errorHandler';

export const settingsRouter = Router();

settingsRouter.use(requireAuth, requirePermission('telegram', 'view'));

settingsRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const rows = await prisma.setting.findMany();
    const map: Record<string, string | null> = {};
    for (const row of rows) map[row.key] = row.value;
    res.json({ settings: map });
  })
);

settingsRouter.patch(
  '/',
  requirePermission('telegram', 'edit'),
  asyncHandler(async (req, res) => {
    const entries = Object.entries(req.body?.settings ?? {}) as [string, string | null][];
    await prisma.$transaction(
      entries.map(([key, value]) =>
        prisma.setting.upsert({ where: { key }, create: { key, value }, update: { value } })
      )
    );
    res.status(204).end();
  })
);
