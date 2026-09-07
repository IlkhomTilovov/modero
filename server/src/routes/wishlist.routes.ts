import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { asyncHandler } from '../middleware/errorHandler';
import { ApiError } from '../lib/ApiError';

export const wishlistRouter = Router();

const deviceIdSchema = z.string().min(8).max(200);

wishlistRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const parsed = deviceIdSchema.safeParse(req.query.deviceId);
    if (!parsed.success) throw new ApiError(400, 'deviceId talab qilinadi');

    const items = await prisma.wishlistItem.findMany({
      where: { deviceId: parsed.data },
      include: { product: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ items: items.map((i) => i.product), productIds: items.map((i) => i.productId) });
  })
);

const addSchema = z.object({
  deviceId: deviceIdSchema,
  productId: z.string().uuid(),
});

wishlistRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const parsed = addSchema.safeParse(req.body);
    if (!parsed.success) throw new ApiError(400, "Ma'lumotlarni to'liq kiriting");

    const { deviceId, productId } = parsed.data;
    const item = await prisma.wishlistItem.upsert({
      where: { deviceId_productId: { deviceId, productId } },
      update: {},
      create: { deviceId, productId },
    });
    res.status(201).json({ item });
  })
);

wishlistRouter.delete(
  '/:productId',
  asyncHandler(async (req, res) => {
    const parsed = deviceIdSchema.safeParse(req.query.deviceId);
    if (!parsed.success) throw new ApiError(400, 'deviceId talab qilinadi');

    await prisma.wishlistItem.deleteMany({
      where: { deviceId: parsed.data, productId: req.params.productId },
    });
    res.status(204).end();
  })
);
