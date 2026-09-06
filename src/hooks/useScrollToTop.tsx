import { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

/**
 * Hook to handle scroll behavior on route changes
 * - If URL has a hash, scroll to that element
 * - On POP navigation (back/forward), preserve browser's restored scroll position
 * - Otherwise scroll to hero section or top of page
 */
export function useScrollToTop() {
  const { pathname, hash, search } = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    // On back/forward, let the browser restore scroll position
    if (navigationType === 'POP' && !hash) {
      return;
    }

    const timeout = setTimeout(() => {
      if (hash) {
        const element = document.querySelector(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
          return;
        }
      }

      const heroElement = document.getElementById('hero');
      if (heroElement) {
        heroElement.scrollIntoView({ behavior: 'instant' });
      } else {
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
    }, 0);

    return () => clearTimeout(timeout);
  }, [pathname, hash, search, navigationType]);
}
