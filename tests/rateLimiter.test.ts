import { describe, it, expect } from 'vitest';
import { getClientIp } from '../server/rateLimiter';
import { Request } from 'express';

describe('rateLimiter IP extraction', () => {
  it('extracts first IP from comma-separated x-forwarded-for header', () => {
    const mockReq = {
      headers: {
        'x-forwarded-for': '203.0.113.195, 70.41.3.18, 150.172.238.178',
      },
      socket: {},
    } as unknown as Request;

    expect(getClientIp(mockReq)).toBe('203.0.113.195');
  });

  it('handles single IP in x-forwarded-for header', () => {
    const mockReq = {
      headers: {
        'x-forwarded-for': '198.51.100.42',
      },
      socket: {},
    } as unknown as Request;

    expect(getClientIp(mockReq)).toBe('198.51.100.42');
  });

  it('falls back to req.ip or socket.remoteAddress when header is absent', () => {
    const mockReq = {
      headers: {},
      ip: '127.0.0.1',
      socket: { remoteAddress: '127.0.0.1' },
    } as unknown as Request;

    expect(getClientIp(mockReq)).toBe('127.0.0.1');
  });
});
