import { useEffect } from 'react';
import { site } from '../config/site';

/** Sets the browser tab title to "<title> · Devel", or just "Devel". */
export function useDocumentTitle(title?: string): void {
  useEffect(() => {
    document.title = title ? `${title} · ${site.name}` : site.name;
  }, [title]);
}