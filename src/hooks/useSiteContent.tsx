import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { apiGet, apiPut, ApiError } from '@/integrations/api/client';
import { useToast } from './use-toast';
import { getTranslated } from '@shared/translate';

interface ContentItem {
  id: string;
  key: string;
  value_uz: string | null;
  value_ru: string | null;
  translations: Record<string, { value?: string }> | null;
  content_type: string | null;
  page: string | null;
  section: string | null;
}

interface ContentUpdateEvent {
  type: 'content-update';
  key: string;
  language: string;
  value: string;
  timestamp: number;
}

interface SiteContentContextType {
  content: Record<string, ContentItem>;
  loading: boolean;
  getContent: (key: string, language: string, fallback?: string) => string;
  updateContent: (key: string, language: string, value: string) => Promise<boolean>;
  refreshContent: () => Promise<void>;
  lastUpdate: ContentUpdateEvent | null;
}

const SiteContentContext = createContext<SiteContentContextType | undefined>(undefined);

// Notify parent window about content updates (for iframe communication)
const notifyParentWindow = (event: ContentUpdateEvent) => {
  try {
    // Check if we're in an iframe
    if (window.parent !== window) {
      window.parent.postMessage(event, '*');
    }
  } catch (error) {
    console.log('Could not notify parent window:', error);
  }
};

// Notify iframe about content sync request
export const notifyIframeRefresh = () => {
  try {
    const iframe = document.querySelector('iframe') as HTMLIFrameElement;
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage({ type: 'content-refresh' }, '*');
    }
  } catch (error) {
    console.log('Could not notify iframe:', error);
  }
};

const CACHE_KEY = 'site-content-cache-v1';

function readCache(): Record<string, ContentItem> {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeCache(map: Record<string, ContentItem>) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(map));
  } catch {}
}

export function SiteContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<Record<string, ContentItem>>(() => readCache());
  // If cache exists, we're not "loading" from the UI's perspective — content is already available.
  const [loading, setLoading] = useState(() => Object.keys(readCache()).length === 0);
  const [lastUpdate, setLastUpdate] = useState<ContentUpdateEvent | null>(null);
  const { toast } = useToast();

  const fetchContent = useCallback(async () => {
    try {
      const { items } = await apiGet<{ items: any[] }>('/api/site-content');

      const contentMap: Record<string, ContentItem> = {};
      items.forEach((item) => {
        contentMap[item.key] = {
          id: item.id,
          key: item.key,
          value_uz: item.valueUz,
          value_ru: item.valueRu,
          translations: item.translations,
          content_type: item.contentType,
          page: item.page,
          section: item.section,
        };
      });
      setContent(contentMap);
      writeCache(contentMap);
    } catch (error) {
      console.error('Error fetching site content:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  // Listen for messages from parent (when in iframe) or from iframe (when parent)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Handle refresh request from parent
      if (event.data?.type === 'content-refresh') {
        console.log('Received refresh request from parent');
        fetchContent();
      }
      
      // Handle content update from iframe (when we're the parent/admin panel)
      if (event.data?.type === 'content-update') {
        console.log('Received content update from iframe:', event.data);
        setLastUpdate(event.data as ContentUpdateEvent);
        
        // Update local content state
        const { key, language, value } = event.data;

        setContent((prev) => ({
          ...prev,
          [key]: {
            ...prev[key],
            id: prev[key]?.id || key,
            key,
            value_uz: language === 'uz' ? value : prev[key]?.value_uz || null,
            value_ru: language === 'ru' ? value : prev[key]?.value_ru || null,
            translations: { ...(prev[key]?.translations || {}), [language]: { value } },
            content_type: prev[key]?.content_type || 'text',
            page: prev[key]?.page || null,
            section: prev[key]?.section || null,
          },
        }));
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [fetchContent]);

  const getContent = useCallback((key: string, language: string, fallback: string = '') => {
    const item = content[key];
    if (!item) return fallback;
    const legacyValue = (language === 'ru' ? item.value_ru : item.value_uz) || '';
    return getTranslated(item.translations, language, 'value', legacyValue) || fallback;
  }, [content]);

  const updateContent = useCallback(async (key: string, language: string, value: string): Promise<boolean> => {
    try {
      await apiPut(`/api/site-content/${encodeURIComponent(key)}`, {
        valueUz: language === 'uz' ? value : content[key]?.value_uz,
        valueRu: language === 'ru' ? value : content[key]?.value_ru,
        language,
        value,
        contentType: content[key]?.content_type || 'text',
        page: content[key]?.page,
        section: content[key]?.section,
      });

      // Update local state
      setContent((prev) => ({
        ...prev,
        [key]: {
          ...prev[key],
          id: prev[key]?.id || key,
          key,
          value_uz: language === 'uz' ? value : prev[key]?.value_uz || null,
          value_ru: language === 'ru' ? value : prev[key]?.value_ru || null,
          translations: { ...(prev[key]?.translations || {}), [language]: { value } },
          content_type: prev[key]?.content_type || 'text',
          page: prev[key]?.page || null,
          section: prev[key]?.section || null,
        },
      }));

      // Notify parent window about the update (for iframe communication)
      const updateEvent: ContentUpdateEvent = {
        type: 'content-update',
        key,
        language,
        value,
        timestamp: Date.now(),
      };
      setLastUpdate(updateEvent);
      notifyParentWindow(updateEvent);

      toast({ title: 'Saqlandi', description: 'Kontent muvaffaqiyatli yangilandi' });
      return true;
    } catch (error: any) {
      console.error('Error updating content:', error);
      toast({ variant: 'destructive', title: 'Xatolik', description: error.message });
      return false;
    }
  }, [content, toast]);

  const refreshContent = useCallback(async () => {
    setLoading(true);
    await fetchContent();
  }, [fetchContent]);

  return (
    <SiteContentContext.Provider value={{ content, loading, getContent, updateContent, refreshContent, lastUpdate }}>
      {children}
    </SiteContentContext.Provider>
  );
}

export function useSiteContent() {
  const context = useContext(SiteContentContext);
  if (context === undefined) {
    throw new Error('useSiteContent must be used within a SiteContentProvider');
  }
  return context;
}