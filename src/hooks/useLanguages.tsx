import { useEffect, useState } from 'react';
import { apiGet } from '@/integrations/api/client';

export interface CatalogLanguage {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
  is_default: boolean;
  sort_order: number;
}

function mapLanguage(l: any): CatalogLanguage {
  return {
    id: l.id,
    code: l.code,
    name: l.name,
    is_active: l.isActive,
    is_default: l.isDefault,
    sort_order: l.sortOrder,
  };
}

// Public hook: active catalog languages, for the header language switcher.
export function useActiveLanguages() {
  const [languages, setLanguages] = useState<CatalogLanguage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { items } = await apiGet<{ items: any[] }>('/api/languages');
        setLanguages(items.map(mapLanguage));
      } catch (e) {
        console.error('useActiveLanguages:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { languages, loading };
}

// Admin hook: every language (including inactive), for the Languages admin page.
export function useAllLanguages() {
  const [languages, setLanguages] = useState<CatalogLanguage[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = async () => {
    setLoading(true);
    try {
      const { items } = await apiGet<{ items: any[] }>('/api/languages/admin');
      setLanguages(items.map(mapLanguage));
    } catch (e) {
      console.error('useAllLanguages:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refetch();
  }, []);

  return { languages, loading, refetch };
}
