import React, {useCallback, useEffect, useState} from 'react';

import {getErrorMessage} from './format';

export type AsyncState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

export function useRemoteResource<T>(
  loader: () => Promise<T>,
): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await loader();
      setData(result);
    } catch (caughtError) {
      setError(getErrorMessage(caughtError));
    } finally {
      setLoading(false);
    }
  }, [loader]);

  useEffect(() => {
    // ResourceBlock renders load failures inline with a Retry control,
    // so swallow here to avoid a toast storm on mount (optional endpoints).
    refresh().catch(() => {});
  }, [refresh]);

  return {data, loading, error, refresh};
}

export function ResourceBlock<T>({
  state,
  children,
}: {
  state: AsyncState<T>;
  children: React.ReactNode;
}) {
  if (state.loading) {
    return (
      <div className="skeleton-block" aria-busy="true" aria-label="Loading">
        <span className="skeleton-line skeleton-line-lg" />
        <span className="skeleton-line" />
        <span className="skeleton-line" />
        <span className="skeleton-line skeleton-line-sm" />
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="stack">
        <div className="notice error">{state.error}</div>
        <button
          type="button"
          className="secondary-button"
          onClick={() => {
            state.refresh().catch(() => {});
          }}>
          Retry
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
