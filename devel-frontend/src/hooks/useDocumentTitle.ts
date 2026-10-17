import { useEffect } from 'react';
import { site } from '../config/site';

/** Sets the browser tab title to "<title> · <site name>", or just the site name. */
export function useDocumentTitle(title?: string): void {
  useEffect(() => {
    document.title = title ? `${title} · ${site.name}` : site.name;
  }, [title]);
}