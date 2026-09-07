import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { apiGet, apiPost, apiDelete } from '@/integrations/api/client';

const DEVICE_ID_KEY = 'furniture-device-id';

function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

interface WishlistContextType {
  productIds: Set<string>;
  isWishlisted: (productId: string) => boolean;
  toggleWishlist: (productId: string) => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [productIds, setProductIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const deviceId = getDeviceId();
    apiGet<{ productIds: string[] }>('/api/wishlist', { deviceId })
      .then((res) => setProductIds(new Set(res.productIds)))
      .catch(() => {});
  }, []);

  const toggleWishlist = (productId: string) => {
    const deviceId = getDeviceId();
    const alreadyIn = productIds.has(productId);

    setProductIds((prev) => {
      const next = new Set(prev);
      if (alreadyIn) next.delete(productId);
      else next.add(productId);
      return next;
    });

    const revert = () =>
      setProductIds((prev) => {
        const next = new Set(prev);
        if (alreadyIn) next.add(productId);
        else next.delete(productId);
        return next;
      });

    if (alreadyIn) {
      apiDelete(`/api/wishlist/${productId}?deviceId=${encodeURIComponent(deviceId)}`).catch(revert);
    } else {
      apiPost('/api/wishlist', { deviceId, productId }).catch(revert);
    }
  };

  const isWishlisted = (productId: string) => productIds.has(productId);

  return (
    <WishlistContext.Provider value={{ productIds, isWishlisted, toggleWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within WishlistProvider');
  }
  return context;
}
