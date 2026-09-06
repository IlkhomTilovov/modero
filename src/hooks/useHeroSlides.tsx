import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
      const { data, error } = await supabase
        .from('hero_slides')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      const slides = (data || []) as HeroSlide[];
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
      const { data, error } = await supabase
        .from('hero_slides')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return (data || []) as HeroSlide[];
    },
    staleTime: 30 * 1000,
  });
}
