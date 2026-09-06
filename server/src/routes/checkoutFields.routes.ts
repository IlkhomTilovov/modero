import { prisma } from '../db';
import { createCrudRouter } from '../lib/crudRouter';

export const checkoutFieldsRouter = createCrudRouter({
  delegate: prisma.checkoutField,
  permissionModule: 'siteContent',
  orderBy: { sortOrder: 'asc' },
  publicWhere: { isActive: true },
});

export const checkoutFieldOptionsRouter = createCrudRouter({
  delegate: prisma.checkoutFieldOption,
  permissionModule: 'siteContent',
  orderBy: { sortOrder: 'asc' },
  publicWhere: { isActive: true },
});
