import type { ReactNode } from 'react';

/** Loading, error and empty states share one look. */
export function StatusMessage({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div role="status" className="py-16 text-center">
      <p className="font-serif text-2xl text-zinc-900 dark:text-zinc-100">{title}</p>
      {children && <div className="mt-2 text-zinc-500 dark:text-zinc-400">{children}</div>}
    </div>
  );
}