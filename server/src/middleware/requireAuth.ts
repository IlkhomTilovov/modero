import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../lib/jwt';
import { ApiError } from '../lib/ApiError';

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.access_token;
  if (!token) return next(new ApiError(401, "Avtorizatsiyadan o'tilmagan"));

  const payload = verifyAccessToken(token);
  if (!payload) return next(new ApiError(401, 'Sessiya muddati tugagan, qayta kiring'));

  req.user = { id: payload.sub, role: payload.role };
  next();
}

export function requireRole(...roles: Array<'admin' | 'manager' | 'seller'>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new ApiError(401, "Avtorizatsiyadan o'tilmagan"));
    if (!roles.includes(req.user.role)) return next(new ApiError(403, 'Ruxsat yo‘q'));
    next();
  };
}
