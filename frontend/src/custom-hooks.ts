import { useEffect, useState } from 'react';

export interface LoadState {
  status?: 'loading' | 'finished' | 'errored';
  error?: any;
}

export function useLoad<T>(
  loader: () => Promise<T>,
  ordinal: number
): [T | undefined, LoadState] {
  const [resource, setResource] = useState<T>();
  const [resourceLoad, setResourceLoad] = useState<LoadState>({
    status: 'loading',
  });
  useEffect(() => {
    (async () => {
      try {
        console.log('trying to load');
        setResource(await loader());
        setResourceLoad({ status: 'finished' });
      } catch (e) {
        setResourceLoad({ status: 'errored', error: e });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ordinal]);

  return [resource, resourceLoad];
}
