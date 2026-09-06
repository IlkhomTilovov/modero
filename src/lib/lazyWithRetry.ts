import { lazy, ComponentType } from "react";

const RELOAD_KEY = "__chunk_reload_at__";

/**
 * Yangi deploy'dan keyin eski chunk fayllari yo'qoladi ("Failed to fetch
 * dynamically imported module"). Bunday holatda sahifani bir marta qayta
 * yuklaymiz, shunda brauzer yangi manifest/chunk'larni oladi.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) {
  return lazy(async () => {
    try {
      const mod = await factory();
      try {
        sessionStorage.removeItem(RELOAD_KEY);
      } catch {}
      return mod;
    } catch (error) {
      let last = 0;
      try {
        last = Number(sessionStorage.getItem(RELOAD_KEY) || 0);
      } catch {}
      const now = Date.now();
      // 10 soniya ichida faqat bir marta reload — cheksiz loop bo'lmasin
      if (now - last > 10_000) {
        try {
          sessionStorage.setItem(RELOAD_KEY, String(now));
        } catch {}
        window.location.reload();
        // reload boshlanguncha Suspense'da qolib turadi
        return new Promise<{ default: T }>(() => {});
      }
      throw error;
    }
  });
}
