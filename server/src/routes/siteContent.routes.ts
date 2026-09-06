import { Router } from 'express';
import { prisma } from '../db';
import { requireAuth } from '../middleware/requireAuth';
import { requirePermission } from '../middleware/requirePermission';
import { asyncHandler } from '../middleware/errorHandler';

export const siteContentRouter = Router();

siteContentRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const rows = await prisma.siteContent.findMany();
    res.json({ items: rows });
  })
);

siteContentRouter.put(
  '/:key',
  requireAuth,
  requirePermission('siteContent', 'edit'),
  asyncHandler(async (req, res) => {
    const { key } = req.params;
    const { valueUz, valueRu, contentType, page, section } = req.body;
    const row = await prisma.siteContent.upsert({
      where: { key },
      create: { key, valueUz, valueRu, contentType, page, section },
      update: { valueUz, valueRu, contentType, page, section },
    });
    res.json({ item: row });
  })
);
