import { prisma } from '../db';
import { createCrudRouter } from '../lib/crudRouter';

export const sectionsRouter = createCrudRouter({
  delegate: prisma.section,
  permissionModule: 'categories',
  orderBy: { sortOrder: 'asc' },
  publicWhere: { isActive: true },
});
