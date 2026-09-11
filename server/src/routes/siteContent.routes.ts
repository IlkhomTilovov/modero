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
    const { valueUz, valueRu, contentType, page, section, language, value } = req.body;

    // `language`/`value` (any admin-added language) merge into the existing
    // translations blob rather than overwriting it — each edit only touches
    // one language at a time, unlike the catalog forms which save all languages at once.
    const existing = await prisma.siteContent.findUnique({ where: { key } });
    const translations: Record<string, any> = { ...((existing?.translations as Record<string, unknown>) || {}) };
    if (typeof language === 'string' && typeof value === 'string') {
      translations[language] = { value };
    }

    const row = await prisma.siteContent.upsert({
      where: { key },
      create: { key, valueUz, valueRu, translations, contentType, page, section },
      update: { valueUz, valueRu, translations, contentType, page, section },
    });
    res.json({ item: row });
  })
);
