import { useEffect, useState } from 'react';

export interface LoadState {
  status?: 'waiting for trigger' | 'loading' | 'finished' | 'errored';
  error?: any;
}

export function useLoad<T>(
  loader: () => Promise<T>,
  /**
   * useLoad will run each time the trigger changes to something truthy.
   */
  trigger: any
): [T | undefined, LoadState] {
  const [resource, setResource] = useState<T>();
  const [resourceLoad, setResourceLoad] = useState<LoadState>({
    status: 'loading',
  });
  useEffect(() => {
    if (!trigger) {
      setResourceLoad({ status: 'waiting for trigger' });
      return;
    }
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
