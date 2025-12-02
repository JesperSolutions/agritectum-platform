import { useEffect } from 'react';
// Use a default favicon - logo can be added to public folder
// For now, use a data URI or default icon
const defaultFavicon = '/favicon.ico';

export function useFavicon(customUrl?: string) {
  useEffect(() => {
    const href = customUrl || defaultFavicon;
    let link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    const prev = link.href;
    link.href = href;
    return () => {
      if (prev) link!.href = prev;
    };
  }, [customUrl]);
}


