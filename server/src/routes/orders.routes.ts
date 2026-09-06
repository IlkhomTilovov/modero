import { Router } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../db';
import { optionalAuth } from '../middleware/optionalAuth';
import { requireAuth } from '../middleware/requireAuth';
import { requirePermission } from '../middleware/requirePermission';
import { asyncHandler } from '../middleware/errorHandler';
import { ApiError } from '../lib/ApiError';
import { nextOrderNumber } from '../lib/orderNumber';
import { createAmoLead } from '../lib/amocrm';
import { sendOrderNotification } from '../lib/telegram';

export const ordersRouter = Router();

const orderItemSchema = z.object({
  product_id: z.string(),
  quantity: z.number().int().min(1).max(100),
  selected_options: z.object({ size: z.string().optional(), color: z.string().optional() }).optional(),
});

const createOrderSchema = z.object({
  customer_name: z.string(),
  customer_phone: z.string(),
  customer_message: z.string().optional(),
  items: z.array(orderItemSchema).min(1),
});

ordersRouter.post(
  '/',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const parsed = createOrderSchema.safeParse(req.body);
    if (!parsed.success) throw new ApiError(400, "Ma'lumotlarni to'liq kiriting");
    const body = parsed.data;

    if (body.customer_name.trim().length < 2) {
      throw new ApiError(400, "Ism kamida 2 belgidan iborat bo'lishi kerak");
    }
    if (!body.customer_phone.startsWith('+998') || body.customer_phone.length < 12) {
      throw new ApiError(400, "Telefon raqam noto'g'ri formatda");
    }

    const productIds = body.items.map((i) => i.product_id);
    const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
    if (products.length === 0) throw new ApiError(404, 'Mahsulotlar topilmadi');

    const productMap = new Map(products.map((p) => [p.id, p]));

    let totalPrice = 0;
    const orderItemsData: {
      productId: string;
      productNameSnapshot: string;
      quantity: number;
      priceSnapshot: number;
      selectedOptions: Prisma.InputJsonValue | typeof Prisma.JsonNull;
    }[] = [];

    for (const item of body.items) {
      const product = productMap.get(item.product_id);
      if (!product) throw new ApiError(404, `Mahsulot topilmadi: ${item.product_id}`);
      if (!product.isActive) throw new ApiError(400, `Mahsulot faol emas: ${product.nameUz || product.nameRu}`);

      const serverPrice = product.price || 0;
      totalPrice += serverPrice * item.quantity;

      orderItemsData.push({
        productId: item.product_id,
        productNameSnapshot: product.nameUz || product.nameRu || 'Unknown',
        quantity: item.quantity,
        priceSnapshot: serverPrice,
        selectedOptions: item.selected_options ?? Prisma.JsonNull,
      });
    }

    const cleanPhone = body.customer_phone.replace(/\s/g, '');
    const customerName = body.customer_name.trim();
    const orderNumber = await nextOrderNumber();

    const order = await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.upsert({
        where: { phone: cleanPhone },
        create: { phone: cleanPhone, name: customerName },
        update: { name: customerName },
      });

      const created = await tx.order.create({
        data: {
          orderNumber,
          customerName,
          customerPhone: cleanPhone,
          customerMessage: body.customer_message || null,
          totalPrice,
          status: 'new',
          customerId: customer.id,
          createdByUserId: req.user?.id ?? null,
          items: { createMany: { data: orderItemsData } },
        },
        include: { items: true },
      });

      return created;
    });

    // Fire-and-forget: amoCRM lead creation must never slow down or fail the checkout response.
    createAmoLead('order', {
      order_number: order.orderNumber,
      customer_name: order.customerName,
      customer_phone: order.customerPhone,
      customer_message: order.customerMessage ?? undefined,
      total_price: totalPrice,
      items: orderItemsData.map((i) => ({
        product_name: i.productNameSnapshot,
        quantity: i.quantity,
        price: i.priceSnapshot,
        selected_options: i.selectedOptions as { size?: string; color?: string } | undefined,
      })),
    }).catch((err) => console.error('AmoCRM lead creation failed (non-blocking):', err));

    res.json({ success: true, order_number: order.orderNumber, total_price: totalPrice });
  })
);

ordersRouter.get(
  '/',
  requireAuth,
  requirePermission('orders', 'view'),
  asyncHandler(async (req, res) => {
    // Sellers only ever see orders they created themselves.
    const where = req.user!.role === 'seller' ? { createdByUserId: req.user!.id } : undefined;
    const orders = await prisma.order.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ items: orders });
  })
);

ordersRouter.get(
  '/:id',
  requireAuth,
  requirePermission('orders', 'view'),
  asyncHandler(async (req, res) => {
    const order = await prisma.order.findUnique({ where: { id: req.params.id }, include: { items: true } });
    if (!order) throw new ApiError(404, 'Buyurtma topilmadi');
    res.json({ item: order });
  })
);

ordersRouter.patch(
  '/:id',
  requireAuth,
  requirePermission('orders', 'edit'),
  asyncHandler(async (req, res) => {
    const { status } = req.body;
    const order = await prisma.order.update({ where: { id: req.params.id }, data: { status } });
    res.json({ item: order });
  })
);

ordersRouter.delete(
  '/:id',
  requireAuth,
  requirePermission('orders', 'delete'),
  asyncHandler(async (req, res) => {
    await prisma.order.delete({ where: { id: req.params.id } });
    res.status(204).end();
  })
);

// Sends the current order's details to the configured Telegram chat. The bot token
// never leaves the server — the client only ever asks "send this order" by id.
ordersRouter.post(
  '/:id/notify-telegram',
  requireAuth,
  requirePermission('orders', 'view'),
  asyncHandler(async (req, res) => {
    const order = await prisma.order.findUnique({ where: { id: req.params.id }, include: { items: true } });
    if (!order) throw new ApiError(404, 'Buyurtma topilmadi');

    const label = typeof req.body?.statusLabel === 'string' ? req.body.statusLabel : undefined;

    await sendOrderNotification({
      order_number: order.orderNumber,
      customer_name: order.customerName,
      customer_phone: order.customerPhone,
      customer_message: label ? `${label}${order.customerMessage ? ` — ${order.customerMessage}` : ''}` : order.customerMessage ?? undefined,
      total_price: order.totalPrice ?? 0,
      items: order.items.map((i) => ({
        product_name: i.productNameSnapshot,
        quantity: i.quantity,
        price: i.priceSnapshot ?? 0,
        selected_options: (i.selectedOptions as { size?: string; color?: string } | null) ?? undefined,
      })),
    });

    res.json({ success: true });
  })
);
