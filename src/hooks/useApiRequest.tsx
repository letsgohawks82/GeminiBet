// src/hooks/useApiRequest.tsx
import { useCallback, useRef, useState, useEffect } from 'react';

export interface ApiResponseMeta {
  status: number;
  rateRemaining?: string | null;
  retryAfter?: string | null;
  cached?: boolean;
}

export interface UseApiRequestResult<T = any> {
  call: (
    endpoint: string,
    body: any,
    opts?: RequestInit
  ) => Promise<{ data: T; meta: ApiResponseMeta } | null>;
  loading: boolean;
  error: string | null;
  status: number | null;
  retryAfterSec: number | null;
  rateLimitRemaining: number | null;
  abort: () => void;
  reset: () => void;
}

export function useApiRequest<T = any>(): UseApiRequestResult<T> {
  const controllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<number | null>(null);
  const [retryAfterSec, setRetryAfterSec] = useState<number | null>(null);
  const [rateLimitRemaining, setRateLimitRemaining] = useState<number | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
    };
  }, []);

  const reset = useCallback(() => {
    setError(null);
    setStatus(null);
    setRetryAfterSec(null);
    setRateLimitRemaining(null);
    setLoading(false);
  }, []);

  const call = useCallback(
    async (endpoint: string, body: any, opts: RequestInit = {}) => {
      // Abort previous in-flight request on new call
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
      const ctrl = new AbortController();
      controllerRef.current = ctrl;

      if (isMountedRef.current) {
        setLoading(true);
        setError(null);
        setStatus(null);
        setRetryAfterSec(null);
      }

      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(opts.headers || {}),
          },
          body: body !== undefined ? JSON.stringify(body) : undefined,
          signal: ctrl.signal,
          ...opts,
        });

        const remainingHeader = res.headers.get('X-RateLimit-Remaining');
        const retryAfterHeader = res.headers.get('Retry-After');
        const parsedRemaining = remainingHeader ? parseInt(remainingHeader, 10) : null;
        const parsedRetryAfter = retryAfterHeader ? parseInt(retryAfterHeader, 10) : null;

        if (isMountedRef.current) {
          setStatus(res.status);
          setRateLimitRemaining(parsedRemaining);
          setRetryAfterSec(parsedRetryAfter);
        }

        let json: any = null;
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          json = await res.json();
        } else {
          const text = await res.text();
          json = { text };
        }

        if (!res.ok) {
          const msg = json?.error || res.statusText || `Request failed with status ${res.status}`;
          if (isMountedRef.current) {
            setError(msg);
            setLoading(false);
          }
          const err: any = new Error(msg);
          err.status = res.status;
          err.retryAfterSec = parsedRetryAfter;
          err.rateLimitRemaining = parsedRemaining;
          throw err;
        }

        if (isMountedRef.current) {
          setLoading(false);
        }

        return {
          data: json as T,
          meta: {
            status: res.status,
            rateRemaining: remainingHeader,
            retryAfter: retryAfterHeader,
            cached: json?.cached,
          },
        };
      } catch (err: any) {
        if (err.name === 'AbortError' || err.message === 'The user aborted a request.') {
          if (isMountedRef.current) {
            setLoading(false);
          }
          return null;
        }
        if (isMountedRef.current) {
          setError(err.message || 'Network request failed');
          setLoading(false);
        }
        throw err;
      }
    },
    []
  );

  const abort = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.abort();
      controllerRef.current = null;
    }
    if (isMountedRef.current) {
      setLoading(false);
    }
  }, []);

  return {
    call,
    loading,
    error,
    status,
    retryAfterSec,
    rateLimitRemaining,
    abort,
    reset,
  };
}
