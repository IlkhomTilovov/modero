import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { initTelegram, isTelegramWebApp, getTelegramUser, TelegramUser } from '@/lib/telegram';

interface TelegramContextType {
  isInTelegram: boolean;
  user: TelegramUser | undefined;
}

const TelegramContext = createContext<TelegramContextType>({
  isInTelegram: false,
  user: undefined,
});

export function TelegramProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initTelegram();
    setReady(true);
  }, []);

  const value = useMemo<TelegramContextType>(
    () => ({
      isInTelegram: ready && isTelegramWebApp(),
      user: ready ? getTelegramUser() : undefined,
    }),
    [ready]
  );

  return <TelegramContext.Provider value={value}>{children}</TelegramContext.Provider>;
}

export const useTelegram = () => useContext(TelegramContext);
