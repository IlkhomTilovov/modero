import { ReactNode } from 'react';
import { useTelegram } from '@/hooks/useTelegram';
import { TelegramBottomNav } from './TelegramBottomNav';

/**
 * Wraps the public site layout. When the app is running inside Telegram WebApp:
 *  - Adds bottom padding so content is not hidden behind the bottom nav
 *  - Renders the sticky TelegramBottomNav
 */
export function TelegramShell({ children }: { children: ReactNode }) {
  const { isInTelegram } = useTelegram();

  return (
    <>
      <div className={isInTelegram ? 'pb-20' : ''}>{children}</div>
      {isInTelegram && <TelegramBottomNav />}
    </>
  );
}
