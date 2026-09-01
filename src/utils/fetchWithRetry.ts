/**
 * Robust fetch wrapper with Exponential Backoff, Jitter, and Retry-After header handling.
 */
export interface FetchWithRetryOptions extends RequestInit {
  retries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
}

export async function fetchWithRetry(
  input: RequestInfo | URL,
  init: FetchWithRetryOptions = {}
): Promise<Response> {
  const { retries = 3, baseDelayMs = 500, maxDelayMs = 5000, ...fetchOptions } = init;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(input, fetchOptions);

      if (res.ok) {
        return res;
      }

      // Check if status is transient or rate limited
      const status = res.status;
      const isTransient = status === 429 || status >= 500;

      if (!isTransient || attempt === retries) {
        const errorText = await res.text().catch(() => '');
        throw new Error(errorText || `HTTP ${status}: Request failed`);
      }

      // Calculate exponential backoff + jitter
      let delayMs = Math.min(maxDelayMs, baseDelayMs * Math.pow(2, attempt));
      const jitter = Math.floor(Math.random() * 250);
      delayMs += jitter;

      // Honor Retry-After header if provided by remote
      const retryAfter = res.headers.get('Retry-After');
      if (retryAfter) {
        const seconds = Number(retryAfter);
        if (!isNaN(seconds)) {
          delayMs = Math.max(delayMs, seconds * 1000);
        }
      }

      // If signal was aborted, do not wait
      if (fetchOptions.signal?.aborted) {
        throw new DOMException('Aborted', 'AbortError');
      }

      await new Promise((resolve) => setTimeout(resolve, delayMs));
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw err;
      }
      if (attempt === retries) {
        throw err;
      }
      // Wait before retry on network error
      const delayMs = baseDelayMs * Math.pow(2, attempt) + Math.floor(Math.random() * 200);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw new Error('Maximum request retries reached');
}
