import { useEffect } from 'react';
// Import existing logo from repo root
// Vite will bundle and return a URL
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import logoUrl from '../../main logo.png';

export function useFavicon(customUrl?: string) {
  useEffect(() => {
    const href = customUrl || (logoUrl as string);
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


