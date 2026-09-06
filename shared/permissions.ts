// Role-based Access Control (RBAC) permissions configuration.
// Imported by BOTH the frontend (src/lib/permissions.ts) and the backend
// (server/src/middleware/requirePermission.ts) so enforcement can never drift apart.

export type AppRole = 'admin' | 'manager' | 'seller';

export interface Permission {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
}

export interface RolePermissions {
  dashboard: Permission;
  orders: Permission;
  categories: Permission;
  products: Permission;
  customers: Permission;
  siteContent: Permission;
  themes: Permission;
  admins: Permission;
  telegram: Permission;
  systemSettings: Permission;
}

export const rolePermissions: Record<AppRole, RolePermissions> = {
  // SELLER: Orders and customers only
  seller: {
    dashboard: { view: true, create: false, edit: false, delete: false },
    orders: { view: true, create: true, edit: true, delete: false },
    categories: { view: false, create: false, edit: false, delete: false },
    products: { view: false, create: false, edit: false, delete: false },
    customers: { view: true, create: false, edit: false, delete: false },
    siteContent: { view: false, create: false, edit: false, delete: false },
    themes: { view: false, create: false, edit: false, delete: false },
    admins: { view: false, create: false, edit: false, delete: false },
    telegram: { view: false, create: false, edit: false, delete: false },
    systemSettings: { view: false, create: false, edit: false, delete: false },
  },

  // MANAGER: Categories, products, content, telegram
  manager: {
    dashboard: { view: true, create: false, edit: false, delete: false },
    orders: { view: false, create: false, edit: false, delete: false },
    categories: { view: true, create: true, edit: true, delete: true },
    products: { view: true, create: true, edit: true, delete: true },
    customers: { view: false, create: false, edit: false, delete: false },
    siteContent: { view: true, create: true, edit: true, delete: true },
    themes: { view: true, create: true, edit: true, delete: true },
    admins: { view: false, create: false, edit: false, delete: false },
    telegram: { view: true, create: true, edit: true, delete: true },
    systemSettings: { view: false, create: false, edit: false, delete: false },
  },

  // ADMIN: Full access
  admin: {
    dashboard: { view: true, create: true, edit: true, delete: true },
    orders: { view: true, create: true, edit: true, delete: true },
    categories: { view: true, create: true, edit: true, delete: true },
    products: { view: true, create: true, edit: true, delete: true },
    customers: { view: true, create: true, edit: true, delete: true },
    siteContent: { view: true, create: true, edit: true, delete: true },
    themes: { view: true, create: true, edit: true, delete: true },
    admins: { view: true, create: true, edit: true, delete: true },
    telegram: { view: true, create: true, edit: true, delete: true },
    systemSettings: { view: true, create: true, edit: true, delete: true },
  },
};

export function hasPermission(
  role: AppRole | null,
  module: keyof RolePermissions,
  action: keyof Permission
): boolean {
  if (!role) return false;
  return rolePermissions[role]?.[module]?.[action] ?? false;
}

export function canViewModule(role: AppRole | null, module: keyof RolePermissions): boolean {
  return hasPermission(role, module, 'view');
}
