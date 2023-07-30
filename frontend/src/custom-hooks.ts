import { useEffect, useMemo, useState } from 'react';

export interface LoadState {
  status?: 'loading' | 'finished' | 'errored';
  error?: any;
}

export function useLoad<T>(
  loader: (...args: any[]) => Promise<T>,
  args: any[]
): [T | undefined, LoadState] {
  const loaderMemo = useMemo(() => loader, [loader]);
  const argsMemo = useMemo(() => args, [args]);

  const [resource, setResource] = useState<T>();
  const [resourceLoad, setResourceLoad] = useState<LoadState>({
    status: 'loading',
  });
  useEffect(() => {
    (async () => {
      try {
        setResource(await loaderMemo(...argsMemo));
        setResourceLoad({ status: 'finished' });
      } catch (e) {
        setResourceLoad({ status: 'errored', error: e });
      }
    })();
  }, [loaderMemo, argsMemo]);

  return [resource, resourceLoad];
}
