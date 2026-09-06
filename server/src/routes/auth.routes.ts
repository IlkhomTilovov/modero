import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { verifyPassword } from '../lib/password';
import {
  signAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  refreshTokenExpiryDate,
} from '../lib/jwt';
import { setAuthCookies, clearAuthCookies } from '../lib/cookies';
import { requireAuth } from '../middleware/requireAuth';
import { asyncHandler } from '../middleware/errorHandler';
import { ApiError } from '../lib/ApiError';
import type { AppRole } from '@shared/permissions';

export const authRouter = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

async function loadUserBundle(userId: string) {
  const [user, profile, userRole] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.profile.findUnique({ where: { userId } }),
    prisma.userRole.findUnique({ where: { userId } }),
  ]);
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    role: (userRole?.role ?? null) as AppRole | null,
    profile: profile ? { id: profile.id, name: profile.name, email: profile.email, status: profile.status } : null,
  };
}

async function issueSession(userId: string, role: AppRole) {
  const accessToken = signAccessToken({ sub: userId, role });
  const refreshToken = generateRefreshToken();
  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hashRefreshToken(refreshToken),
      expiresAt: refreshTokenExpiryDate(),
    },
  });
  return { accessToken, refreshToken };
}

authRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) throw new ApiError(400, "Email va parolni to'g'ri kiriting");

    const { email, password } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new ApiError(401, "Email yoki parol noto'g'ri");

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) throw new ApiError(401, "Email yoki parol noto'g'ri");

    const userRole = await prisma.userRole.findUnique({ where: { userId: user.id } });
    if (!userRole) throw new ApiError(403, "Sizga rol biriktirilmagan, administratorga murojaat qiling");

    const { accessToken, refreshToken } = await issueSession(user.id, userRole.role);
    setAuthCookies(res, accessToken, refreshToken);

    const bundle = await loadUserBundle(user.id);
    res.json({ user: bundle });
  })
);

authRouter.post(
  '/logout',
  asyncHandler(async (req, res) => {
    const refreshToken = req.cookies?.refresh_token as string | undefined;
    if (refreshToken) {
      const tokenHash = hashRefreshToken(refreshToken);
      await prisma.refreshToken.updateMany({
        where: { tokenHash, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    clearAuthCookies(res);
    res.status(204).end();
  })
);

authRouter.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const bundle = await loadUserBundle(req.user!.id);
    if (!bundle) throw new ApiError(401, 'Foydalanuvchi topilmadi');
    res.json({ user: bundle });
  })
);

authRouter.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const refreshToken = req.cookies?.refresh_token as string | undefined;
    if (!refreshToken) throw new ApiError(401, 'Sessiya topilmadi');

    const tokenHash = hashRefreshToken(refreshToken);
    const existing = await prisma.refreshToken.findFirst({
      where: { tokenHash, revokedAt: null, expiresAt: { gt: new Date() } },
    });
    if (!existing) {
      clearAuthCookies(res);
      throw new ApiError(401, 'Sessiya muddati tugagan, qayta kiring');
    }

    const userRole = await prisma.userRole.findUnique({ where: { userId: existing.userId } });
    if (!userRole) {
      clearAuthCookies(res);
      throw new ApiError(403, 'Sizga rol biriktirilmagan');
    }

    // Rotate: revoke the used refresh token, issue a fresh pair.
    await prisma.refreshToken.update({ where: { id: existing.id }, data: { revokedAt: new Date() } });
    const { accessToken, refreshToken: newRefreshToken } = await issueSession(existing.userId, userRole.role);
    setAuthCookies(res, accessToken, newRefreshToken);

    res.status(204).end();
  })
);
