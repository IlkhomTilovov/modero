import { prisma } from '../db';
import { createCrudRouter } from '../lib/crudRouter';

export const branchesRouter = createCrudRouter({
  delegate: prisma.branch,
  permissionModule: 'siteContent',
  orderBy: { orderIndex: 'asc' },
  publicWhere: { isActive: true },
});
