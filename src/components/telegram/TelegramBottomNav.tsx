import { NavLink, useLocation } from 'react-router-dom';
import { Home, Search, ShoppingBag, Heart, User } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { haptic } from '@/lib/telegram';
import { cn } from '@/lib/utils';

const items = [
  { to: '/', icon: Home, label: 'Asosiy' },
  { to: '/catalog', icon: Search, label: 'Katalog' },
  { to: '/cart', icon: ShoppingBag, label: 'Savat', isCart: true },
  { to: '/contact', icon: Heart, label: 'Aloqa' },
  { to: '/about', icon: User, label: 'Biz xaqimizda' },
];

export function TelegramBottomNav() {
  const { totalItems } = useCart();
  const location = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-center justify-around h-16">
        {items.map(({ to, icon: Icon, label, isCart }) => {
          const active = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
          return (
            <NavLink
              key={to}
              to={to}
              onClick={() => haptic.selection()}
              className={cn(
                'flex flex-col items-center justify-center gap-1 flex-1 h-full text-[10px] font-medium transition-colors relative',
                active ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <div className="relative">
                <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 1.8} />
                {isCart && totalItems > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-primary text-primary-foreground text-[9px] font-bold min-w-[16px] h-4 rounded-full flex items-center justify-center px-1">
                    {totalItems > 9 ? '9+' : totalItems}
                  </span>
                )}
              </div>
              <span className="leading-none">{label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
