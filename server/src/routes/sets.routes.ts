import { prisma } from '../db';
import { createCrudRouter } from '../lib/crudRouter';

export const setsRouter = createCrudRouter({
  delegate: prisma.set,
  permissionModule: 'products',
  orderBy: { sortOrder: 'asc' },
  publicWhere: { isActive: true },
});
