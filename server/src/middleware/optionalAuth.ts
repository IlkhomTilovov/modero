import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../lib/jwt';

// Attaches req.user if a valid access token cookie is present, but never rejects the request.
export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.access_token;
  if (token) {
    const payload = verifyAccessToken(token);
    if (payload) req.user = { id: payload.sub, role: payload.role };
  }
  next();
}
