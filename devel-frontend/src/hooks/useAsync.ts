import { useEffect, useState } from 'react';

export type AsyncState<T> =
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: unknown };

/**
 * Runs `load(key)` and tracks loading, success and error, re-running when `key` changes.
 * Pass a stable function (one defined at module level, like the services).
 *
 * LEARN: the `active` flag ignores a response that arrives after the component moved on
 * (navigated to another post), so an old request can't overwrite newer data.
 */
export function useAsync<K, T>(load: (key: K) => Promise<T>, key: K): AsyncState<T> {
  const [result, setResult] = useState<{ key: K; state: AsyncState<T> } | null>(null);

  useEffect(() => {
    let active = true;
    load(key).then(
      (data) => active && setResult({ key, state: { status: 'success', data } }),
      (error: unknown) => active && setResult({ key, state: { status: 'error', error } }),
    );
    return () => {
      active = false;
    };
  }, [load, key]);

  if (result === null || result.key !== key) {
    return { status: 'loading' };
  }
  return result.state;
}