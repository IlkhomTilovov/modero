import { useEffect, useState } from 'react';
import { apiGet } from '@/integrations/api/client';
import { mapApiProduct, type Product } from '@/hooks/useProducts';

export interface ProductSet {
  id: string;
  title_uz: string;
  title_ru: string;
  translations: Record<string, { title?: string }> | null;
  image: string | null;
  href: string | null;
  product_ids: string[];
  sort_order: number;
  is_active: boolean;
}

function mapSet(s: any): ProductSet {
  return {
    id: s.id,
    title_uz: s.titleUz,
    title_ru: s.titleRu,
    translations: s.translations,
    image: s.image,
    href: s.href,
    product_ids: s.productIds,
    sort_order: s.sortOrder,
    is_active: s.isActive,
  };
}

// Public hook: returns active sets + their products (for homepage)
export function useActiveSets(enabled = true) {
  const [sets, setSets] = useState<ProductSet[]>([]);
  const [productsBySet, setProductsBySet] = useState<Record<string, Product[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const { items } = await apiGet<{ items: any[] }>('/api/sets');
        const list = items.map(mapSet);
        setSets(list);

        try {
          localStorage.setItem(
            'sets-active-v1',
            JSON.stringify(list.slice(0, 1).map((s) => ({ image: s.image })))
          );
        } catch {}

        const allIds = Array.from(new Set(list.flatMap((s) => s.product_ids || [])));
        if (allIds.length > 0) {
          const { items: prods } = await apiGet<{ items: any[] }>('/api/products', {
            productIds: allIds,
            pageSize: allIds.length,
          });
          const byId: Record<string, Product> = {};
          prods.map(mapApiProduct).forEach((p) => {
            byId[p.id] = p;
          });
          const map: Record<string, Product[]> = {};
          list.forEach((s) => {
            map[s.id] = (s.product_ids || []).map((id) => byId[id]).filter(Boolean);
          });
          setProductsBySet(map);
        }
      } catch (e) {
        console.error('useActiveSets:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [enabled]);

  return { sets, productsBySet, loading };
}

// Admin hook: returns all sets
export function useAllSets() {
  const [sets, setSets] = useState<ProductSet[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = async () => {
    setLoading(true);
    try {
      const { items } = await apiGet<{ items: any[] }>('/api/sets/admin');
      setSets(items.map(mapSet));
    } catch (e) {
      console.error('useAllSets:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refetch();
  }, []);

  return { sets, loading, refetch };
}
