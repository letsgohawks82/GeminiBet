import { GoogleGenAI } from '@google/genai';
import { logStructured } from './metrics';

export interface NormalizedErrorInfo {
  status: number;
  isRateLimit: boolean;
  isTransient: boolean;
  retryAfterSec: number | null;
  code: string;
  message: string;
}

const RATE_LIMIT_REGEX = /(?:429|resource[_\s]?exhausted|quota|rate[_\s]?limit|too many requests|tokens per minute)/i;
const TRANSIENT_ERROR_REGEX = /(?:500|502|503|504|econnreset|etimedout|socket|network|overloaded)/i;

/**
 * Safely extracts status, retry headers, and transient properties from any SDK or network error.
 */
export function extractErrorInfo(err: any): NormalizedErrorInfo {
  if (!err) {
    return {
      status: 500,
      isRateLimit: false,
      isTransient: false,
      retryAfterSec: null,
      code: 'UNKNOWN_ERROR',
      message: 'An unknown error occurred',
    };
  }

  const rawMessage = typeof err.message === 'string' ? err.message : String(err);
  const status = Number(err.status || err.statusCode || err.response?.status || (rawMessage.includes('429') ? 429 : 500));

  let retryAfterSec: number | null = null;
  const rawRetry =
    err?.headers?.get?.('retry-after') ||
    err?.response?.headers?.get?.('retry-after') ||
    err?.headers?.['retry-after'] ||
    err?.response?.headers?.['retry-after'];

  if (rawRetry) {
    const parsed = Number(rawRetry);
    if (!isNaN(parsed) && parsed > 0) {
      retryAfterSec = Math.ceil(parsed);
    }
  }

  const isRateLimit = status === 429 || RATE_LIMIT_REGEX.test(rawMessage);
  const isTransient = isRateLimit || status >= 500 || TRANSIENT_ERROR_REGEX.test(rawMessage);

  return {
    status,
    isRateLimit,
    isTransient,
    retryAfterSec,
    code: isRateLimit ? 'RATE_LIMIT_EXCEEDED' : status >= 500 ? 'AI_SERVICE_UNAVAILABLE' : 'AI_REQUEST_FAILED',
    message: rawMessage.replace(/AIzaSy[A-Za-z0-9_-]{20,50}/g, '[REDACTED_API_KEY]'), // Safeguard against echoing raw keys
  };
}

let genAIInstance: GoogleGenAI | null = null;

export function getGenAIClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on server');
  }
  if (!genAIInstance) {
    genAIInstance = new GoogleGenAI({ apiKey });
  }
  return genAIInstance;
}

export interface RetryConfig {
  maxRetries?: number;
  baseDelayMs?: number;
  maxBackoffMs?: number;
  model?: string;
}

/**
 * Robust GenAI execution wrapper with exponential backoff, jitter, and safety limits.
 */
export async function callGenAIWithBackoff<T>(
  operation: (ai: GoogleGenAI) => Promise<T>,
  config: RetryConfig = {}
): Promise<T> {
  const maxRetries = config.maxRetries ?? (Number(process.env.AI_MAX_RETRIES) || 3);
  const baseDelayMs = config.baseDelayMs ?? (Number(process.env.AI_BASE_DELAY_MS) || 500);
  const maxBackoffMs = config.maxBackoffMs ?? (Number(process.env.AI_MAX_BACKOFF_MS) || 60000);
  const model = config.model || 'gemini-2.5-flash';

  const ai = getGenAIClient();
  let lastErrorInfo: NormalizedErrorInfo | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation(ai);
    } catch (err: any) {
      const errorInfo = extractErrorInfo(err);
      lastErrorInfo = errorInfo;

      const isLastAttempt = attempt >= maxRetries;
      if (!errorInfo.isTransient || isLastAttempt) {
        logStructured('error', 'GenAI request failed permanently', {
          model,
          attempt,
          maxRetries,
          status: errorInfo.status,
          code: errorInfo.code,
          isTransient: errorInfo.isTransient,
          message: errorInfo.message,
        });
        const finalError: any = new Error(errorInfo.message);
        finalError.status = errorInfo.status;
        finalError.code = errorInfo.code;
        finalError.retryAfterSec = errorInfo.retryAfterSec;
        throw finalError;
      }

      // Calculate exponential delay + jitter
      let delayMs = Math.min(maxBackoffMs, baseDelayMs * Math.pow(2, attempt));
      const jitter = Math.floor(Math.random() * 300);
      delayMs += jitter;

      if (errorInfo.retryAfterSec) {
        delayMs = Math.max(delayMs, errorInfo.retryAfterSec * 1000);
      }
      delayMs = Math.min(delayMs, maxBackoffMs);

      logStructured('warn', 'GenAI request transient error, retrying', {
        model,
        attempt: attempt + 1,
        maxRetries,
        delayMs,
        status: errorInfo.status,
        code: errorInfo.code,
      });

      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  const errToThrow: any = new Error(lastErrorInfo?.message || 'Max retries exhausted');
  errToThrow.status = lastErrorInfo?.status || 500;
  errToThrow.code = lastErrorInfo?.code || 'AI_RETRIES_EXHAUSTED';
  errToThrow.retryAfterSec = lastErrorInfo?.retryAfterSec;
  throw errToThrow;
}
