import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { requirePermission } from '../middleware/requirePermission';
import { asyncHandler } from '../middleware/errorHandler';
import type { RolePermissions } from '@shared/permissions';

interface CrudDelegate {
  findMany: (args?: any) => Promise<any[]>;
  findUnique: (args: any) => Promise<any>;
  create: (args: any) => Promise<any>;
  update: (args: any) => Promise<any>;
  delete: (args: any) => Promise<any>;
}

interface CrudRouterOptions {
  delegate: CrudDelegate;
  permissionModule: keyof RolePermissions;
  orderBy: any;
  publicWhere?: any;
}

/**
 * Standard CRUD router for simple, flat, admin-managed resources:
 * GET /            -> public, filtered by publicWhere (e.g. { isActive: true })
 * GET /admin       -> requires view permission, returns every row (admin management screens)
 * POST /           -> requires create permission
 * PATCH /:id       -> requires edit permission
 * DELETE /:id      -> requires delete permission
 */
export function createCrudRouter({ delegate, permissionModule, orderBy, publicWhere }: CrudRouterOptions) {
  const router = Router();

  router.get(
    '/',
    asyncHandler(async (_req, res) => {
      const rows = await delegate.findMany({ where: publicWhere, orderBy });
      res.json({ items: rows });
    })
  );

  router.get(
    '/admin',
    requireAuth,
    requirePermission(permissionModule, 'view'),
    asyncHandler(async (_req, res) => {
      const rows = await delegate.findMany({ orderBy });
      res.json({ items: rows });
    })
  );

  router.get(
    '/:id',
    asyncHandler(async (req, res) => {
      const row = await delegate.findUnique({ where: { id: req.params.id } });
      res.json({ item: row });
    })
  );

  router.post(
    '/',
    requireAuth,
    requirePermission(permissionModule, 'create'),
    asyncHandler(async (req, res) => {
      const row = await delegate.create({ data: req.body });
      res.status(201).json({ item: row });
    })
  );

  router.patch(
    '/:id',
    requireAuth,
    requirePermission(permissionModule, 'edit'),
    asyncHandler(async (req, res) => {
      const row = await delegate.update({ where: { id: req.params.id }, data: req.body });
      res.json({ item: row });
    })
  );

  router.delete(
    '/:id',
    requireAuth,
    requirePermission(permissionModule, 'delete'),
    asyncHandler(async (req, res) => {
      await delegate.delete({ where: { id: req.params.id } });
      res.status(204).end();
    })
  );

  return router;
}
