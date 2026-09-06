import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/integrations/api/client';

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

function mapTile(t: any): PromoTile {
  return {
    id: t.id,
    title_uz: t.titleUz,
    title_ru: t.titleRu,
    icon: t.icon,
    bg_class: t.bgClass,
    text_class: t.textClass,
    href: t.href,
    sort_order: t.sortOrder,
    is_active: t.isActive,
  };
}

export function usePromoTiles(enabled = true) {
  return useQuery({
    queryKey: ['promo_tiles'],
    queryFn: async (): Promise<PromoTile[]> => {
      const { items } = await apiGet<{ items: any[] }>('/api/promo-tiles');
      return items.map(mapTile);
    },
    enabled,
  });
}

export function useAllPromoTiles() {
  return useQuery({
    queryKey: ['promo_tiles_all'],
    queryFn: async (): Promise<PromoTile[]> => {
      const { items } = await apiGet<{ items: any[] }>('/api/promo-tiles/admin');
      return items.map(mapTile);
    },
  });
}
