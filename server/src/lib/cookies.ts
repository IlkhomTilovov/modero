import type { Response } from 'express';
import { env } from '../env';
import { accessTokenMaxAgeMs, refreshTokenMaxAgeMs } from './jwt';

const isProd = env.NODE_ENV === 'production';

export function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  res.cookie('access_token', accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: accessTokenMaxAgeMs(),
    path: '/',
  });
  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: refreshTokenMaxAgeMs(),
    path: '/api/auth',
  });
}

export function clearAuthCookies(res: Response) {
  res.clearCookie('access_token', { path: '/' });
  res.clearCookie('refresh_token', { path: '/api/auth' });
}
