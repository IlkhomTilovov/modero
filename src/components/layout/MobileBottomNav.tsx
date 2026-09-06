import { NavLink, useLocation } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { Home, ShoppingBag, Phone, Menu, LayoutGrid } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useLanguage } from '@/hooks/useLanguage';
import { cn } from '@/lib/utils';

type NavItem = {
  to?: string;
  label: { uz: string; ru: string };
  icon?: LucideIcon;
  image?: string;
  isCart?: boolean;
  action?: 'open-menu';
};

const items: NavItem[] = [
  { to: '/', icon: Home, label: { uz: 'Asosiy', ru: 'Главная' } },
  { to: '/catalog', icon: LayoutGrid, label: { uz: 'Katalog', ru: 'Каталог' } },
  { to: '/cart', icon: ShoppingBag, label: { uz: 'Savat', ru: 'Корзина' }, isCart: true },
  { to: '/contact', icon: Phone, label: { uz: 'Aloqa', ru: 'Контакты' } },
  { icon: Menu, label: { uz: 'Menyu', ru: 'Меню' }, action: 'open-menu' },
];

export function MobileBottomNav() {
  const { totalItems } = useCart();
  const { language } = useLanguage();
  const location = useLocation();

  return (
    <div
      className="md:hidden fixed left-0 right-0 bottom-0 z-50 px-4 pb-3 pointer-events-none"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}
    >
      <nav className="pointer-events-auto mx-auto max-w-md rounded-full bg-background shadow-[0_10px_30px_-10px_hsl(var(--foreground)/0.25)] ring-1 ring-border px-2 py-2 flex items-center justify-between">
        {items.map((item, idx) => {
          const { to, icon: Icon, image, label, isCart, action } = item;
          const labelText = label[language];
          const active = to
            ? to === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(to)
            : false;

          const content = (
            <>
              <div className="relative flex items-center justify-center">
                {image ? (
                  <img
                    src={image}
                    alt=""
                    width={20}
                    height={20}
                    loading="lazy"
                    decoding="async"
                    className={cn(
                      'h-5 w-5 object-contain transition-all',
                      active && 'invert'
                    )}
                  />
                ) : (
                  Icon && <Icon className="h-5 w-5" strokeWidth={active ? 2.2 : 1.8} />
                )}
                {isCart && totalItems > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-primary text-primary-foreground text-[9px] font-bold min-w-[16px] h-4 rounded-full flex items-center justify-center px-1 ring-2 ring-background">
                    {totalItems > 9 ? '9+' : totalItems}
                  </span>
                )}
              </div>
              {active && <span className="text-xs font-medium whitespace-nowrap">{labelText}</span>}
            </>
          );

          const classes = cn(
            'relative flex items-center justify-center h-11 rounded-full transition-all',
            active ? 'bg-primary text-primary-foreground px-4 gap-2' : 'text-foreground/70 hover:text-foreground w-11'
          );

          if (action === 'open-menu') {
            return (
              <button
                key={idx}
                type="button"
                aria-label={labelText}
                onClick={() => window.dispatchEvent(new Event('open-mobile-menu'))}
                className={classes}
              >
                {content}
              </button>
            );
          }

          return (
            <NavLink key={idx} to={to!} className={classes}>
              {content}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
