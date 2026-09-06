import { prisma } from '../db';
import { createCrudRouter } from '../lib/crudRouter';

export const promoTilesRouter = createCrudRouter({
  delegate: prisma.promoTile,
  permissionModule: 'siteContent',
  orderBy: { sortOrder: 'asc' },
  publicWhere: { isActive: true },
});
