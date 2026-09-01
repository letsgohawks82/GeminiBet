import { Request, Response } from 'express';
import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import Redis from 'ioredis';
import { logStructured } from './metrics';

export function getClientIp(req: Request): string {
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff.trim().length > 0) {
    return xff.split(',')[0].trim();
  }
  if (Array.isArray(xff) && xff.length > 0) {
    return xff[0].trim();
  }
  return req.ip || req.socket.remoteAddress || 'unknown-ip';
}

const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS) || 60 * 1000; // 1 minute
const maxRequests = Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 60; // 60 requests per window

let redisClient: Redis | null = null;
let storeInstance: any = undefined;

if (process.env.REDIS_URL) {
  try {
    redisClient = new Redis(process.env.REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: 2,
    });
    redisClient.connect().catch((err) => {
      logStructured('warn', 'Redis connection failed for rate limiter, falling back to memory store', {
        error: err.message,
      });
    });

    storeInstance = new RedisStore({
      // @ts-expect-error - rate-limit-redis types compatibility
      sendCommand: (...args: string[]) => redisClient?.call(args[0], ...args.slice(1)),
    });
    logStructured('info', 'Rate limiter initialized with Redis store');
  } catch (err: any) {
    logStructured('warn', 'Could not initialize Redis store for rate limiter, using Memory store', {
      error: err.message,
    });
  }
}

export const apiRateLimiter: RateLimitRequestHandler = rateLimit({
  windowMs,
  max: maxRequests,
  standardHeaders: true, // Return standard RateLimit-* headers
  legacyHeaders: true, // X-RateLimit-* headers
  store: storeInstance,
  keyGenerator: (req: Request): string => getClientIp(req),
  handler: (req: Request, res: Response) => {
    const ip = getClientIp(req);
    const retryAfterSec = Math.ceil(windowMs / 1000);

    res.setHeader('Retry-After', retryAfterSec);
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', 0);

    logStructured('warn', 'Rate limit exceeded for client IP', {
      ip,
      path: req.path,
      retryAfterSec,
    });

    return res.status(429).json({
      error: 'Too many requests. Please slow down.',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfterSec,
    });
  },
});
