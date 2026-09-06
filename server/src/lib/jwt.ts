import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../env';
import type { AppRole } from '@shared/permissions';

export interface AccessTokenPayload {
  sub: string;
  role: AppRole;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: `${env.ACCESS_TOKEN_TTL_MIN}m` });
}

export function verifyAccessToken(token: string): AccessTokenPayload | null {
  try {
    return jwt.verify(token, env.JWT_SECRET) as AccessTokenPayload;
  } catch {
    return null;
  }
}

export function generateRefreshToken(): string {
  return crypto.randomBytes(48).toString('hex');
}

export function hashRefreshToken(token: string): string {
  return crypto.createHmac('sha256', env.JWT_REFRESH_SECRET).update(token).digest('hex');
}

export function refreshTokenExpiryDate(): Date {
  const days = env.REFRESH_TOKEN_TTL_DAYS;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

export function accessTokenMaxAgeMs(): number {
  return env.ACCESS_TOKEN_TTL_MIN * 60 * 1000;
}

export function refreshTokenMaxAgeMs(): number {
  return env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000;
}
