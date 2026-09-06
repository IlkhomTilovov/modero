import { prisma } from '../db';
import { createCrudRouter } from '../lib/crudRouter';

export const categoriesRouter = createCrudRouter({
  delegate: prisma.category,
  permissionModule: 'categories',
  orderBy: { sortOrder: 'asc' },
  publicWhere: { isActive: true },
});
