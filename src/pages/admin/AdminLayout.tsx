import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import '@/styles/admin-fonts.css';

import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Settings,
  Menu,
  X,
  LogOut,
  Bell,
  Palette,
  FolderTree,
  MapPin,
  Users,
  Shield,
  FileText,
  ClipboardList,
  Settings2,
  MessageSquare,
  LayoutGrid,
  Layers,
  ChevronDown,
  ShoppingBag,
  Boxes,
  PaintBucket,
  Cog,
  Images,
  LucideIcon,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { RolePermissions, roleDisplayInfo } from '@/lib/permissions';
import { Badge } from '@/components/ui/badge';
import { useAdminT } from '@/hooks/useAdminT';
import { useLanguage } from '@/hooks/useLanguage';

interface NavItem {
  titleKey: keyof ReturnType<typeof useAdminT>['layout'];
  url: string;
  icon: LucideIcon;
  module: keyof RolePermissions;
}

interface NavGroup {
  titleKey: keyof ReturnType<typeof useAdminT>['layout'];
  icon: LucideIcon;
  items: NavItem[];
}

// Standalone (no group) items
const standaloneItems: NavItem[] = [
  { titleKey: 'navDashboard', url: '/admin', icon: LayoutDashboard, module: 'dashboard' },
];

const navGroups: NavGroup[] = [
  {
    titleKey: 'groupSales',
    icon: ShoppingBag,
    items: [
      { titleKey: 'navOrders', url: '/admin/orders', icon: ShoppingCart, module: 'orders' },
      { titleKey: 'navCustomers', url: '/admin/customers', icon: Users, module: 'customers' },
      { titleKey: 'navMessages', url: '/admin/messages', icon: MessageSquare, module: 'customers' },
    ],
  },
  {
    titleKey: 'groupCatalog',
    icon: Boxes,
    items: [
      { titleKey: 'navSections', url: '/admin/sections', icon: LayoutGrid, module: 'categories' },
      { titleKey: 'navCategories', url: '/admin/categories', icon: FolderTree, module: 'categories' },
      { titleKey: 'navProducts', url: '/admin/products', icon: Package, module: 'products' },
      { titleKey: 'navPromoTiles', url: '/admin/promo-tiles', icon: LayoutGrid, module: 'siteContent' },
      { titleKey: 'navSets', url: '/admin/sets', icon: Layers, module: 'siteContent' },
    ],
  },
  {
    titleKey: 'groupSiteContent',
    icon: PaintBucket,
    items: [
      { titleKey: 'navHeroSlides', url: '/admin/hero-slides', icon: Images, module: 'siteContent' },
      { titleKey: 'navSiteContent', url: '/admin/site-content', icon: FileText, module: 'siteContent' },
      { titleKey: 'navBranches', url: '/admin/branches', icon: MapPin, module: 'siteContent' },
      { titleKey: 'navCheckoutForm', url: '/admin/checkout-form', icon: ClipboardList, module: 'siteContent' },
      { titleKey: 'navThemes', url: '/admin/themes', icon: Palette, module: 'themes' },
    ],
  },
  {
    titleKey: 'groupSystem',
    icon: Cog,
    items: [
      { titleKey: 'navAdmins', url: '/admin/admins', icon: Shield, module: 'admins' },
      { titleKey: 'navTelegram', url: '/admin/settings', icon: Settings, module: 'telegram' },
      { titleKey: 'navSystemSettings', url: '/admin/system', icon: Settings2, module: 'systemSettings' },
    ],
  },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { canViewModule, userRole, user, signOut } = useAuth();
  const t = useAdminT();
  const { language, setLanguage } = useLanguage();

  const isActive = (path: string) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  const filteredStandalone = standaloneItems.filter((i) => canViewModule(i.module));
  const filteredGroups = navGroups
    .map((g) => ({ ...g, items: g.items.filter((i) => canViewModule(i.module)) }))
    .filter((g) => g.items.length > 0);

  // Open groups that contain the active route by default
  const initialOpen: Record<string, boolean> = {};
  filteredGroups.forEach((g) => {
    initialOpen[g.titleKey] = g.items.some((i) => isActive(i.url));
  });
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(initialOpen);

  const toggleGroup = (key: string) =>
    setOpenGroups((p) => ({ ...p, [key]: !p[key] }));

  const roleInfo = userRole ? roleDisplayInfo[userRole] : null;

  const LanguageToggle = () => (
    <div className="flex items-center gap-1 rounded-full border border-border bg-background p-0.5">
      {(['uz', 'ru'] as const).map((lng) => (
        <button
          key={lng}
          type="button"
          onClick={() => setLanguage(lng)}
          className={cn(
            'px-2.5 py-1 text-xs font-semibold rounded-full transition-colors',
            language === lng
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
          aria-label={`Switch language to ${lng}`}
        >
          {lng.toUpperCase()}
        </button>
      ))}
    </div>
  );

  const renderNav = (onItemClick?: () => void) => (
    <>
      {filteredStandalone.map((item) => (
        <Link
          key={item.url}
          to={item.url}
          onClick={onItemClick}
          className={cn(
            'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
            isActive(item.url)
              ? 'bg-primary text-primary-foreground'
              : 'text-gray-600 hover:bg-gray-100'
          )}
        >
          <item.icon className="h-5 w-5" />
          {t.layout[item.titleKey]}
        </Link>
      ))}

      {filteredGroups.map((group) => {
        const open = openGroups[group.titleKey];
        const hasActive = group.items.some((i) => isActive(i.url));
        return (
          <div key={group.titleKey} className="space-y-1">
            <button
              type="button"
              onClick={() => toggleGroup(group.titleKey)}
              className={cn(
                'w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                hasActive ? 'text-primary' : 'text-gray-700 hover:bg-gray-100'
              )}
            >
              <span className="flex items-center gap-3">
                <group.icon className="h-5 w-5" />
                {t.layout[group.titleKey]}
              </span>
              <ChevronDown
                className={cn(
                  'h-4 w-4 transition-transform',
                  open ? 'rotate-180' : 'rotate-0'
                )}
              />
            </button>
            {open && (
              <div className="ml-4 pl-3 border-l border-gray-200 space-y-1">
                {group.items.map((item) => (
                  <Link
                    key={item.url}
                    to={item.url}
                    onClick={onItemClick}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                      isActive(item.url)
                        ? 'bg-primary text-primary-foreground font-medium'
                        : 'text-gray-600 hover:bg-gray-100'
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {t.layout[item.titleKey]}
                  </Link>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </>
  );

  return (
    <div className="admin-panel min-h-screen bg-gray-50">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile header */}
      <header className="sticky top-0 z-30 h-16 bg-white border-b flex items-center justify-between px-4 lg:hidden">
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
          <Menu className="h-5 w-5" />
        </Button>
        <Link to="/admin" className="font-serif text-lg font-bold text-primary">
          {t.layout.adminPanel}
        </Link>
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Mobile sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white border-r transform transition-transform lg:hidden flex flex-col',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b shrink-0">
          <Link to="/admin" className="font-serif text-xl font-bold text-primary">
            {t.layout.adminPanel}
          </Link>
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {roleInfo && (
          <div className="p-4 border-b shrink-0">
            <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
            <Badge className={cn('mt-1', roleInfo.color)}>{roleInfo.label}</Badge>
          </div>
        )}

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {renderNav(() => setSidebarOpen(false))}
        </nav>

        <div className="p-4 border-t space-y-2 shrink-0">
          <Button
            variant="outline"
            className="w-full justify-start gap-3"
            onClick={() => navigate('/')}
          >
            <LogOut className="h-4 w-4" />
            {t.layout.backToSite}
          </Button>
          <Button
            variant="destructive"
            className="w-full justify-start gap-3"
            onClick={async () => {
              await signOut();
              navigate('/admin/auth');
            }}
          >
            <LogOut className="h-4 w-4" />
            {t.layout.signOut}
          </Button>
        </div>
      </aside>

      {/* Desktop layout */}
      <div className="hidden lg:flex min-h-screen">
        <aside className="w-64 bg-white border-r fixed inset-y-0 left-0 flex flex-col">
          <div className="flex items-center h-16 px-6 border-b">
            <Link to="/admin" className="font-serif text-xl font-bold text-primary">
              {t.layout.adminPanel}
            </Link>
          </div>

          {roleInfo && (
            <div className="p-4 border-b">
              <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
              <Badge className={cn('mt-1', roleInfo.color)}>{roleInfo.label}</Badge>
            </div>
          )}

          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">{renderNav()}</nav>

          <div className="p-4 border-t mt-auto space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start gap-3"
              onClick={() => navigate('/')}
            >
              <LogOut className="h-4 w-4" />
              {t.layout.backToSite}
            </Button>
            <Button
              variant="destructive"
              className="w-full justify-start gap-3"
              onClick={async () => {
                await signOut();
                navigate('/admin/auth');
              }}
            >
              <LogOut className="h-4 w-4" />
              {t.layout.signOut}
            </Button>
          </div>
        </aside>

        <div className="w-64 flex-shrink-0" />

        <div className="flex-1 min-w-0">
          <header className="sticky top-0 z-20 h-16 bg-white border-b flex items-center justify-end px-6">
            <div className="flex items-center gap-4">
              <LanguageToggle />
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
              </Button>
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
                {user?.email?.charAt(0).toUpperCase() || 'A'}
              </div>
            </div>
          </header>

          <main className="p-6">
            <Outlet />
          </main>
        </div>
      </div>

      <main className="p-4 lg:hidden">
        <Outlet />
      </main>
    </div>
  );
}
