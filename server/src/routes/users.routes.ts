import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { hashPassword } from '../lib/password';
import { requireAuth, requireRole } from '../middleware/requireAuth';
import { asyncHandler } from '../middleware/errorHandler';
import { ApiError } from '../lib/ApiError';

export const usersRouter = Router();

usersRouter.use(requireAuth, requireRole('admin'));

usersRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const users = await prisma.user.findMany({
      include: { profile: true, userRole: true },
      orderBy: { createdAt: 'asc' },
    });
    res.json({
      users: users.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.profile?.name ?? '',
        status: u.profile?.status ?? 'active',
        role: u.userRole?.role ?? null,
        createdAt: u.createdAt,
      })),
    });
  })
);

const createSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  role: z.enum(['admin', 'manager', 'seller']),
});

usersRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) throw new ApiError(400, "Ma'lumotlarni to'liq va to'g'ri kiriting");
    const { email, password, name, role } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new ApiError(400, 'Bu email allaqachon roʻyxatdan oʻtgan');

    const passwordHash = await hashPassword(password);

    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({ data: { email, passwordHash } });
      await tx.profile.create({ data: { userId: created.id, name, email, status: 'active' } });
      await tx.userRole.create({ data: { userId: created.id, role } });
      return created;
    });

    res.status(201).json({ userId: user.id });
  })
);

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.enum(['admin', 'manager', 'seller']).optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

usersRouter.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) throw new ApiError(400, "Ma'lumotlar noto'g'ri");
    const { name, role, status } = parsed.data;
    const { id } = req.params;

    await prisma.$transaction(async (tx) => {
      if (name !== undefined || status !== undefined) {
        await tx.profile.update({
          where: { userId: id },
          data: { ...(name !== undefined && { name }), ...(status !== undefined && { status }) },
        });
      }
      if (role !== undefined) {
        await tx.userRole.update({ where: { userId: id }, data: { role } });
      }
    });

    res.status(204).end();
  })
);

usersRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (id === req.user!.id) throw new ApiError(400, "O'zingizni o'chira olmaysiz");

    await prisma.user.delete({ where: { id } });
    res.status(204).end();
  })
);
