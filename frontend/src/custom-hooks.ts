import { useEffect, useState } from 'react';

export interface LoadState {
  status?: 'loading' | 'finished' | 'errored';
  error?: any;
}

export function useLoad<T>(
  loader: () => Promise<T>,
  /**
   * If you specify this, useLoad will re-run each time the trigger number
   * changes.
   */
  trigger?: number
): [T | undefined, LoadState] {
  const [resource, setResource] = useState<T>();
  const [resourceLoad, setResourceLoad] = useState<LoadState>({
    status: 'loading',
  });
  useEffect(() => {
    setResourceLoad({ status: 'loading' });
    (async () => {
      try {
        setResource(await loader());
        setResourceLoad({ status: 'finished' });
      } catch (e) {
        setResourceLoad({ status: 'errored', error: e });
        // Escalate the error so React can show it to the user immediately
        throw e;
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);

  return [resource, resourceLoad];
}
