import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/integrations/api/client';

export interface HeroSlide {
  id: string;
  title_uz: string;
  title_ru: string;
  subtitle_uz: string;
  subtitle_ru: string;
  cta_text_uz: string;
  cta_text_ru: string;
  cta_link: string;
  image: string | null;
  mobile_image: string | null;
  sort_order: number;
  is_active: boolean;
}

function mapSlide(s: any): HeroSlide {
  return {
    id: s.id,
    title_uz: s.titleUz,
    title_ru: s.titleRu,
    subtitle_uz: s.subtitleUz,
    subtitle_ru: s.subtitleRu,
    cta_text_uz: s.ctaTextUz,
    cta_text_ru: s.ctaTextRu,
    cta_link: s.ctaLink,
    image: s.image,
    mobile_image: s.mobileImage,
    sort_order: s.sortOrder,
    is_active: s.isActive,
  };
}

const CACHE_KEY = 'hero-slides-active-v1';

function readCache(): HeroSlide[] | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as HeroSlide[]) : undefined;
  } catch {
    return undefined;
  }
}

function writeCache(slides: HeroSlide[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(slides));
  } catch {}
}

export function useHeroSlides() {
  return useQuery({
    queryKey: ['hero_slides', 'active'],
    queryFn: async (): Promise<HeroSlide[]> => {
      const { items } = await apiGet<{ items: any[] }>('/api/hero-slides');
      const slides = items.map(mapSlide);
      writeCache(slides);
      return slides;
    },
    initialData: readCache(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAllHeroSlides() {
  return useQuery({
    queryKey: ['hero_slides', 'all'],
    queryFn: async (): Promise<HeroSlide[]> => {
      const { items } = await apiGet<{ items: any[] }>('/api/hero-slides/admin');
      return items.map(mapSlide);
    },
    staleTime: 30 * 1000,
  });
}
