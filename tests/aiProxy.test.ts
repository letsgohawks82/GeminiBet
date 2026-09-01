import { describe, it, expect } from 'vitest';
import { extractErrorInfo, callGenAIWithBackoff } from '../server/aiProxy';

describe('aiProxy error normalization & backoff', () => {
  it('extracts status and retry-after from SDK errors', () => {
    const error429 = {
      status: 429,
      message: 'RESOURCE_EXHAUSTED: Quota exceeded for quota metric',
      headers: {
        get: (name: string) => (name.toLowerCase() === 'retry-after' ? '12' : null),
      },
    };

    const extracted = extractErrorInfo(error429);
    expect(extracted.status).toBe(429);
    expect(extracted.isRateLimit).toBe(true);
    expect(extracted.isTransient).toBe(true);
    expect(extracted.retryAfterSec).toBe(12);
    expect(extracted.code).toBe('RATE_LIMIT_EXCEEDED');
  });

  it('detects transient 503 server errors', () => {
    const error503 = {
      status: 503,
      message: 'Service Unavailable',
    };

    const extracted = extractErrorInfo(error503);
    expect(extracted.status).toBe(503);
    expect(extracted.isTransient).toBe(true);
    expect(extracted.isRateLimit).toBe(false);
    expect(extracted.code).toBe('AI_SERVICE_UNAVAILABLE');
  });

  it('redacts potential API keys from error messages', () => {
    const errorWithKey = {
      status: 400,
      message: 'Invalid key AIzaSyABC1234567890123456789012345678 in request',
    };

    const extracted = extractErrorInfo(errorWithKey);
    expect(extracted.message).not.toContain('AIzaSyABC1234567890123456789012345678');
    expect(extracted.message).toContain('[REDACTED_API_KEY]');
  });

  it('retries transient failures and succeeds on subsequent attempts', async () => {
    // Temporarily ensure API key exists for initialization
    process.env.GEMINI_API_KEY = 'test-gemini-key';

    let attemptCount = 0;
    const mockOperation = async () => {
      attemptCount++;
      if (attemptCount < 3) {
        const err: any = new Error('503 Service Unavailable');
        err.status = 503;
        throw err;
      }
      return 'Success on attempt 3';
    };

    const result = await callGenAIWithBackoff(mockOperation, {
      maxRetries: 3,
      baseDelayMs: 10, // fast test delay
    });

    expect(result).toBe('Success on attempt 3');
    expect(attemptCount).toBe(3);
  });
});
