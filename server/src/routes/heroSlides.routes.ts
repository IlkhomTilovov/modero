import { prisma } from '../db';
import { createCrudRouter } from '../lib/crudRouter';

export const heroSlidesRouter = createCrudRouter({
  delegate: prisma.heroSlide,
  permissionModule: 'siteContent',
  orderBy: { sortOrder: 'asc' },
  publicWhere: { isActive: true },
});
