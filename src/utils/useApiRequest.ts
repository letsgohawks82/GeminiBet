import { useState, useRef, useEffect, useCallback } from 'react';
import { fetchWithRetry, FetchWithRetryOptions } from './fetchWithRetry';

export interface UseApiRequestState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  status: number | null;
  retryAfterSec: number | null;
  rateLimitRemaining: number | null;
}

export function useApiRequest<T = any>() {
  const [state, setState] = useState<UseApiRequestState<T>>({
    data: null,
    loading: false,
    error: null,
    status: null,
    retryAfterSec: null,
    rateLimitRemaining: null,
  });

  const controllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef<boolean>(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
    };
  }, []);

  const execute = useCallback(
    async (
      url: string,
      payload?: any,
      options?: Omit<FetchWithRetryOptions, 'body' | 'method' | 'signal'>
    ): Promise<T | null> => {
      // Abort previous in-flight request
      if (controllerRef.current) {
        controllerRef.current.abort();
      }

      const controller = new AbortController();
      controllerRef.current = controller;

      if (isMountedRef.current) {
        setState((prev) => ({
          ...prev,
          loading: true,
          error: null,
          status: null,
          retryAfterSec: null,
        }));
      }

      try {
        const response = await fetchWithRetry(url, {
          method: payload !== undefined ? 'POST' : 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(options?.headers || {}),
          },
          body: payload !== undefined ? JSON.stringify(payload) : undefined,
          signal: controller.signal,
          ...options,
        });

        // Parse rate limit headers
        const retryAfterHeader = response.headers.get('Retry-After');
        const remainingHeader = response.headers.get('X-RateLimit-Remaining');
        const retryAfterSec = retryAfterHeader ? parseInt(retryAfterHeader, 10) : null;
        const rateLimitRemaining = remainingHeader ? parseInt(remainingHeader, 10) : null;

        const json = await response.json();

        if (isMountedRef.current) {
          setState({
            data: json as T,
            loading: false,
            error: null,
            status: response.status,
            retryAfterSec,
            rateLimitRemaining,
          });
        }
        return json as T;
      } catch (err: any) {
        if (err.name === 'AbortError') {
          return null;
        }

        let errorMessage = err?.message || 'Request failed';
        let parsedRetryAfter: number | null = null;

        try {
          // If error message is a JSON string from backend
          const parsed = JSON.parse(errorMessage);
          if (parsed?.error) {
            errorMessage = parsed.error;
          }
          if (parsed?.retryAfterSec) {
            parsedRetryAfter = parsed.retryAfterSec;
          }
        } catch {
          // Not a JSON error message, leave as is
        }

        if (isMountedRef.current) {
          setState((prev) => ({
            ...prev,
            loading: false,
            error: errorMessage,
            retryAfterSec: parsedRetryAfter,
          }));
        }
        return null;
      } finally {
        if (controllerRef.current === controller) {
          controllerRef.current = null;
        }
      }
    },
    []
  );

  const abort = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.abort();
      controllerRef.current = null;
      if (isMountedRef.current) {
        setState((prev) => ({ ...prev, loading: false }));
      }
    }
  }, []);

  const reset = useCallback(() => {
    abort();
    if (isMountedRef.current) {
      setState({
        data: null,
        loading: false,
        error: null,
        status: null,
        retryAfterSec: null,
        rateLimitRemaining: null,
      });
    }
  }, [abort]);

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    status: state.status,
    retryAfterSec: state.retryAfterSec,
    rateLimitRemaining: state.rateLimitRemaining,
    execute,
    abort,
    reset,
  };
}
