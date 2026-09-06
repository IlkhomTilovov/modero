import { Router } from 'express';
import { prisma } from '../db';
import { requireAuth } from '../middleware/requireAuth';
import { requirePermission } from '../middleware/requirePermission';
import { asyncHandler } from '../middleware/errorHandler';

export const customersRouter = Router();

customersRouter.use(requireAuth, requirePermission('customers', 'view'));

customersRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const phone = typeof req.query.phone === 'string' ? req.query.phone : undefined;
    const customers = await prisma.customer.findMany({
      where: phone ? { phone } : undefined,
      orderBy: { createdAt: 'desc' },
      include: { orders: { select: { totalPrice: true, createdAt: true } } },
    });

    const items = customers.map(({ orders, ...customer }) => ({
      ...customer,
      orderCount: orders.length,
      totalSpent: orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0),
      lastOrderDate: orders.reduce<string | null>((latest, o) => {
        const iso = o.createdAt.toISOString();
        return !latest || iso > latest ? iso : latest;
      }, null),
    }));

    res.json({ items });
  })
);

customersRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const customer = await prisma.customer.findUnique({
      where: { id: req.params.id },
      include: { orders: { orderBy: { createdAt: 'desc' } } },
    });
    res.json({ item: customer });
  })
);

customersRouter.patch(
  '/:id',
  requirePermission('customers', 'edit'),
  asyncHandler(async (req, res) => {
    const { notes } = req.body;
    const customer = await prisma.customer.update({ where: { id: req.params.id }, data: { notes } });
    res.json({ item: customer });
  })
);
