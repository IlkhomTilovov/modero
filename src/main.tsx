import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initializeTheme } from "./hooks/useTheme";

declare const __BUILD_ID__: string;

// Auto cache-buster: har bir yangi build'da eski cache/SW/storage tozalanadi
(function clearStaleCache() {
  try {
    const KEY = "__app_build_id__";
    const prev = localStorage.getItem(KEY);
    if (prev !== __BUILD_ID__) {
      // Muhim kalitlar saqlanadi: auth sessiyasi, tema, savat, til
      const KEEP = /^(sb-|supabase\.|furniture-active-theme|cart|language|i18nextLng|site-assets-cache-)/;
      const toRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k !== KEY && !KEEP.test(k)) toRemove.push(k);
      }
      toRemove.forEach((k) => localStorage.removeItem(k));
      try { sessionStorage.clear(); } catch {}
      if ("caches" in window) {
        caches.keys().then((keys) => keys.forEach((k) => caches.delete(k))).catch(() => {});
      }
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.getRegistrations()
          .then((rs) => rs.forEach((r) => r.unregister()))
          .catch(() => {});
      }
      localStorage.setItem(KEY, __BUILD_ID__);
    }
  } catch {}
})();

// Apply cached theme BEFORE React mounts to prevent FOUC
initializeTheme();

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
