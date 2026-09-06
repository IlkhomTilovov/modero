import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PromoTile {
  id: string;
  title_uz: string;
  title_ru: string;
  icon: string;
  bg_class: string;
  text_class: string;
  href: string;
  sort_order: number;
  is_active: boolean;
}

export function usePromoTiles(enabled = true) {
  return useQuery({
    queryKey: ['promo_tiles'],
    queryFn: async (): Promise<PromoTile[]> => {
      const { data, error } = await supabase
        .from('promo_tiles')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return (data || []) as PromoTile[];
    },
    enabled,
  });
}

export function useAllPromoTiles() {
  return useQuery({
    queryKey: ['promo_tiles_all'],
    queryFn: async (): Promise<PromoTile[]> => {
      const { data, error } = await supabase
        .from('promo_tiles')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return (data || []) as PromoTile[];
    },
  });
}
