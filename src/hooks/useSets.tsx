import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Product } from '@/hooks/useProducts';

export interface ProductSet {
  id: string;
  title_uz: string;
  title_ru: string;
  image: string | null;
  href: string | null;
  product_ids: string[];
  sort_order: number;
  is_active: boolean;
}

// Public hook: returns first active set + its products (for homepage)
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
        const { data: setsData, error } = await supabase
          .from('sets')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });
        if (error) throw error;

        const list = (setsData || []) as ProductSet[];
        setSets(list);
        // LCP preload uchun keshlaymiz (index.html birinchi rasmni preload qiladi)
        try {
          localStorage.setItem(
            'sets-active-v1',
            JSON.stringify(list.slice(0, 1).map(s => ({ image: s.image })))
          );
        } catch {}


        const allIds = Array.from(new Set(list.flatMap(s => s.product_ids || [])));
        if (allIds.length > 0) {
          const { data: prods } = await supabase
            .from('products')
            .select('*')
            .in('id', allIds)
            .eq('is_active', true);
          const byId: Record<string, Product> = {};
          (prods || []).forEach(p => { byId[p.id] = p as Product; });
          const map: Record<string, Product[]> = {};
          list.forEach(s => {
            map[s.id] = (s.product_ids || []).map(id => byId[id]).filter(Boolean);
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
    const { data, error } = await supabase
      .from('sets')
      .select('*')
      .order('sort_order', { ascending: true });
    if (!error) setSets((data || []) as ProductSet[]);
    setLoading(false);
  };

  useEffect(() => { refetch(); }, []);

  return { sets, loading, refetch };
}
