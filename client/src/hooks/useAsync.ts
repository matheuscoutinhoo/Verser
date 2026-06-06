import { useCallback, useEffect, useState } from 'react';

export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

export interface UseAsyncResult<T> {
  data: T | null;
  error: Error | null;
  status: AsyncStatus;
  run: () => Promise<void>;
}

export function useAsync<T>(fetcher: () => Promise<T>, runOnMount = true): UseAsyncResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [status, setStatus] = useState<AsyncStatus>('idle');

  const run = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      const result = await fetcher();
      setData(result);
      setStatus('success');
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setStatus('error');
    }
  }, [fetcher]);

  useEffect(() => {
    if (runOnMount) void run();
  }, [run, runOnMount]);

  return { data, error, status, run };
}
