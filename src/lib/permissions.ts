// Role-based Access Control (RBAC) permissions configuration.
// The actual matrix now lives in shared/permissions.ts so the backend can enforce
// the exact same rules — re-exported here so existing imports keep working.

import type { AppRole, Permission, RolePermissions } from '@shared/permissions';
import { rolePermissions, hasPermission, canViewModule } from '@shared/permissions';

export type { AppRole, Permission, RolePermissions };
export { rolePermissions, hasPermission, canViewModule };

// Get role display info
export const roleDisplayInfo: Record<AppRole, { label: string; description: string; color: string }> = {
  seller: {
    label: 'Sotuvchi',
    description: 'Buyurtmalar va mijozlarni boshqarish',
    color: 'bg-blue-100 text-blue-800',
  },
  manager: {
    label: 'Menejer',
    description: 'Mahsulotlar va kontentni boshqarish',
    color: 'bg-green-100 text-green-800',
  },
  admin: {
    label: 'Admin',
    description: "To'liq ruxsat - barcha bo'limlar",
    color: 'bg-red-100 text-red-800',
  },
};

// Navigation items with required permissions
export interface NavItemConfig {
  title: string;
  url: string;
  icon: string;
  module: keyof RolePermissions;
}

export const navItemConfigs: NavItemConfig[] = [
  { title: 'Dashboard', url: '/admin', icon: 'LayoutDashboard', module: 'dashboard' },
  { title: 'Buyurtmalar', url: '/admin/orders', icon: 'ShoppingCart', module: 'orders' },
  { title: 'Toifalar', url: '/admin/categories', icon: 'FolderTree', module: 'categories' },
  { title: 'Mahsulotlar', url: '/admin/products', icon: 'Package', module: 'products' },
  { title: 'Mijozlar', url: '/admin/customers', icon: 'Users', module: 'customers' },
  { title: 'Sayt kontenti', url: '/admin/site-content', icon: 'FileText', module: 'siteContent' },
  { title: 'Mavzular', url: '/admin/themes', icon: 'Palette', module: 'themes' },
  { title: 'Adminlar', url: '/admin/admins', icon: 'Shield', module: 'admins' },
  { title: 'Telegram', url: '/admin/settings', icon: 'Settings', module: 'telegram' },
  { title: 'Tizim sozlamalari', url: '/admin/system', icon: 'Settings2', module: 'systemSettings' },
  { title: 'Tillar', url: '/admin/languages', icon: 'Languages', module: 'languages' },
];
