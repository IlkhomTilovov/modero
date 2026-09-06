import type { Request, Response, NextFunction } from 'express';
import { ApiError } from '../lib/ApiError';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: err.message });
  }

  console.error(err);
  return res.status(500).json({ error: 'Serverda xatolik yuz berdi' });
}

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: 'Topilmadi' });
}

// Wraps an async route handler so rejected promises reach errorHandler.
export function asyncHandler<T extends (req: Request, res: Response, next: NextFunction) => Promise<unknown>>(fn: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}
