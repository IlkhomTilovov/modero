import { useLanguage } from '@/hooks/useLanguage';
import { adminTranslations, AdminT } from '@/lib/adminTranslations';

export function useAdminT(): AdminT {
  const { language } = useLanguage();
  return (adminTranslations[language] || adminTranslations.uz) as AdminT;
}

