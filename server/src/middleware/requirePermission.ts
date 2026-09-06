import type { Request, Response, NextFunction } from 'express';
import { hasPermission, type Permission, type RolePermissions } from '@shared/permissions';
import { ApiError } from '../lib/ApiError';

export function requirePermission(module: keyof RolePermissions, action: keyof Permission) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new ApiError(401, "Avtorizatsiyadan o'tilmagan"));
    if (!hasPermission(req.user.role, module, action)) {
      return next(new ApiError(403, 'Ruxsat yo‘q'));
    }
    next();
  };
}
