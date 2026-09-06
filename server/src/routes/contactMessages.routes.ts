import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { requireAuth } from '../middleware/requireAuth';
import { asyncHandler } from '../middleware/errorHandler';
import { ApiError } from '../lib/ApiError';

export const contactMessagesRouter = Router();

const createSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email().optional(),
  message: z.string().min(1),
});

contactMessagesRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) throw new ApiError(400, "Ma'lumotlarni to'liq kiriting");
    const row = await prisma.contactMessage.create({ data: parsed.data });
    res.status(201).json({ item: row });
  })
);

// Admin-only from here — any logged-in staff member can triage inquiries.
contactMessagesRouter.use(requireAuth);

contactMessagesRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const rows = await prisma.contactMessage.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ items: rows });
  })
);

contactMessagesRouter.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const row = await prisma.contactMessage.update({
      where: { id: req.params.id },
      data: { isRead: req.body.isRead ?? true },
    });
    res.json({ item: row });
  })
);

contactMessagesRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await prisma.contactMessage.delete({ where: { id: req.params.id } });
    res.status(204).end();
  })
);
