import type { ReactNode } from 'react';

/** Loading, error and empty states share one look. */
export function StatusMessage({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div role="status" className="py-16 text-center">
      <p className="font-serif text-2xl text-ink">{title}</p>
      {children && <div className="mt-2 text-muted">{children}</div>}
    </div>
  );
}