/**
 * Observability & Telemetry Metrics Store
 */
import { aiCache } from './lruCache';

export interface RouteMetric {
  totalRequests: number;
  totalErrors: number;
  rateLimitHits: number;
  totalDurationMs: number;
  estimatedTokensIn: number;
  estimatedTokensOut: number;
}

class TelemetryTracker {
  private startTime = Date.now();
  private routeMetrics = new Map<string, RouteMetric>();
  private recentRequests: { timestamp: number; durationMs: number; status: number }[] = [];

  public trackRequest(route: string, durationMs: number, status: number, tokensIn = 0, tokensOut = 0): void {
    const metric = this.routeMetrics.get(route) || {
      totalRequests: 0,
      totalErrors: 0,
      rateLimitHits: 0,
      totalDurationMs: 0,
      estimatedTokensIn: 0,
      estimatedTokensOut: 0,
    };

    metric.totalRequests += 1;
    metric.totalDurationMs += durationMs;
    metric.estimatedTokensIn += tokensIn;
    metric.estimatedTokensOut += tokensOut;

    if (status >= 400) {
      metric.totalErrors += 1;
    }
    if (status === 429) {
      metric.rateLimitHits += 1;
    }

    this.routeMetrics.set(route, metric);

    // Keep sliding window of last 200 requests for RPM & p95 calculation
    this.recentRequests.push({ timestamp: Date.now(), durationMs, status });
    if (this.recentRequests.length > 200) {
      this.recentRequests.shift();
    }
  }

  public getSummary() {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const requestsLastMinute = this.recentRequests.filter((r) => r.timestamp > oneMinuteAgo).length;

    let totalRequests = 0;
    let totalErrors = 0;
    let total429s = 0;
    let totalDuration = 0;
    let totalTokensIn = 0;
    let totalTokensOut = 0;

    const routes: Record<string, any> = {};

    this.routeMetrics.forEach((metric, route) => {
      totalRequests += metric.totalRequests;
      totalErrors += metric.totalErrors;
      total429s += metric.rateLimitHits;
      totalDuration += metric.totalDurationMs;
      totalTokensIn += metric.estimatedTokensIn;
      totalTokensOut += metric.estimatedTokensOut;

      routes[route] = {
        requests: metric.totalRequests,
        errors: metric.totalErrors,
        rateLimits: metric.rateLimitHits,
        avgLatencyMs: metric.totalRequests > 0 ? Math.round(metric.totalDurationMs / metric.totalRequests) : 0,
        tokensIn: metric.estimatedTokensIn,
        tokensOut: metric.estimatedTokensOut,
      };
    });

    const avgLatencyMs = totalRequests > 0 ? Math.round(totalDuration / totalRequests) : 0;

    return {
      uptimeSeconds: Math.floor((now - this.startTime) / 1000),
      requestsPerMinute: requestsLastMinute,
      totalRequests,
      totalErrors,
      total429s,
      avgLatencyMs,
      estimatedTokensTotal: totalTokensIn + totalTokensOut,
      estimatedTokensIn: totalTokensIn,
      estimatedTokensOut: totalTokensOut,
      cache: aiCache.getStats(),
      routes,
    };
  }
}

export const telemetry = new TelemetryTracker();

export function logStructured(level: 'info' | 'warn' | 'error' | 'debug', message: string, meta: Record<string, any> = {}): void {
  const logObj = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta,
  };
  if (level === 'error') {
    console.error(JSON.stringify(logObj));
  } else if (level === 'warn') {
    console.warn(JSON.stringify(logObj));
  } else {
    console.log(JSON.stringify(logObj));
  }
}
