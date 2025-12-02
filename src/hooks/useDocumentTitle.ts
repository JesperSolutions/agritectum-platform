import { useEffect } from 'react';

export function useDocumentTitle(title: string, opts?: { suffix?: string }) {
  useEffect(() => {
    const prev = document.title;
    const suffix = opts?.suffix ?? 'Agritectum Platform';
    document.title = title ? `${title} – ${suffix}` : suffix;
    return () => {
      document.title = prev;
    };
  }, [title, opts?.suffix]);
}


