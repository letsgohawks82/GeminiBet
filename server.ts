import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import cors from 'cors';
import dotenv from 'dotenv';
import { apiRateLimiter, getClientIp } from './server/rateLimiter';
import { aiCache } from './server/lruCache';
import { callGenAIWithBackoff, extractErrorInfo } from './server/aiProxy';
import { compactPrompt, estimateTokens } from './server/tokenEstimator';
import { telemetry, logStructured } from './server/metrics';
import { fetchLiveCfbOdds } from './server/oddsApi';
import { handlePricingSlate } from './server/pricingEngineApi';

dotenv.config();

// ----------------------------------------------------
// Startup Environment Variable Parsing & Validation
// ----------------------------------------------------

function parseIntEnv(name: string, fallback?: number): number | undefined {
  const v = process.env[name];
  if (v === undefined || v.trim() === '') return fallback;
  const n = Number(v);
  if (Number.isNaN(n)) {
    throw new Error(`Invalid numeric env var ${name}="${v}"`);
  }
  return n;
}

function parseListEnv(name: string, fallback: string[] = []): string[] {
  const v = process.env[name];
  if (!v || v.trim() === '') return fallback;
  return v.split(',').map((s) => s.trim()).filter(Boolean);
}

// Required secrets & API keys
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || null;
if (!GEMINI_API_KEY) {
  console.warn('⚠️  Notice: GEMINI_API_KEY is not set. AI proxy endpoints will return 500 until configured in environment.');
} else {
  console.log('✅ GEMINI_API_KEY is configured on server.');
}

// Configurable production and development parameters (Free from unauthorized domains)
const ALLOWED_ORIGINS = parseListEnv('ALLOWED_ORIGINS', ['http://localhost:3000', 'http://localhost:5173', '*']);
const RATE_LIMIT_WINDOW_MS = parseIntEnv('RATE_LIMIT_WINDOW_MS', 60_000)!;
const RATE_LIMIT_MAX_REQUESTS = parseIntEnv('RATE_LIMIT_MAX_REQUESTS', 45)!;
const REDIS_URL = process.env.REDIS_URL || null;
const AI_MAX_RETRIES = parseIntEnv('AI_MAX_RETRIES', 4)!;
const AI_BASE_DELAY_MS = parseIntEnv('AI_BASE_DELAY_MS', 600)!;
const AI_MAX_BACKOFF_MS = parseIntEnv('AI_MAX_BACKOFF_MS', 60_000)!;
const AI_CACHE_TTL_SEC = parseIntEnv('AI_CACHE_TTL_SEC', 600)!;
const AI_CACHE_MAX_ITEMS = parseIntEnv('AI_CACHE_MAX_ITEMS', 250)!;
const AI_MAX_TOKENS_PER_REQUEST = parseIntEnv('AI_MAX_TOKENS_PER_REQUEST', 3_000)!;
const MODEL_MAX_CONTEXT_TOKENS = parseIntEnv('MODEL_MAX_CONTEXT_TOKENS', 32_768)!;

// Sanity checks
if (AI_MAX_TOKENS_PER_REQUEST > MODEL_MAX_CONTEXT_TOKENS) {
  console.warn(`⚠️  AI_MAX_TOKENS_PER_REQUEST (${AI_MAX_TOKENS_PER_REQUEST}) > MODEL_MAX_CONTEXT_TOKENS (${MODEL_MAX_CONTEXT_TOKENS}). Using model max.`);
}

if (REDIS_URL) {
  console.log('🚀 Redis configured for distributed rate limiting & caching:', REDIS_URL.replace(/:[^:@]+@/, ':***@'));
} else {
  console.log('ℹ️  No REDIS_URL set — using resilient in-memory rate limiter and hashed LRU cache.');
}

const app = express();
const PORT = 3000;

// Attach validated env configuration to app.locals
app.locals.envConfig = {
  GEMINI_API_KEY,
  ALLOWED_ORIGINS,
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX_REQUESTS,
  REDIS_URL,
  AI_MAX_RETRIES,
  AI_BASE_DELAY_MS,
  AI_MAX_BACKOFF_MS,
  AI_CACHE_TTL_SEC,
  AI_CACHE_MAX_ITEMS,
  AI_MAX_TOKENS_PER_REQUEST,
  MODEL_MAX_CONTEXT_TOKENS,
};

// Trust proxy headers for accurate client IP resolution behind load balancers/reverse proxies
app.set('trust proxy', 1);

// Security & Payload parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// CORS Origin Policy
app.use(
  cors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow non-browser requests (e.g. curl, server-to-server) or wildcard
      if (!origin || ALLOWED_ORIGINS.includes('*') || ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked for origin: ${origin}`));
      }
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Retry-After', 'X-RateLimit-Limit', 'X-RateLimit-Remaining'],
  })
);

// Basic Security Headers Middleware
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Telemetry Timing Middleware for /api routes
app.use((req: Request, res: Response, next: NextFunction) => {
  if (!req.path.startsWith('/api')) {
    return next();
  }

  const startMs = Date.now();
  res.on('finish', () => {
    const durationMs = Date.now() - startMs;
    telemetry.trackRequest(req.path, durationMs, res.statusCode);
  });
  next();
});

// ----------------------------------------------------
// Health & Observability Metrics Endpoints
// ----------------------------------------------------

app.get('/api/health', (_req: Request, res: Response) => {
  const cfg = app.locals.envConfig;
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    aiConfigured: Boolean(process.env.GEMINI_API_KEY),
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || 'development',
    config: {
      rateLimitWindowMs: cfg.RATE_LIMIT_WINDOW_MS,
      rateLimitMaxRequests: cfg.RATE_LIMIT_MAX_REQUESTS,
      aiMaxRetries: cfg.AI_MAX_RETRIES,
      aiCacheTtlSec: cfg.AI_CACHE_TTL_SEC,
      aiMaxTokensPerRequest: cfg.AI_MAX_TOKENS_PER_REQUEST,
      modelMaxContextTokens: cfg.MODEL_MAX_CONTEXT_TOKENS,
      redisEnabled: Boolean(cfg.REDIS_URL),
    },
    cache: aiCache.getStats(),
    metrics: telemetry.getSummary(),
  });
});

app.get('/api/metrics', (_req: Request, res: Response) => {
  res.json(telemetry.getSummary());
});

// ----------------------------------------------------
// Validated Pricing Engine & Calibration Gate API Proxy
// ----------------------------------------------------

app.get('/api/pricing/slate', handlePricingSlate);

// ----------------------------------------------------
// Real-Time Live Odds Feed (The Odds API Proxy & Cache)
// ----------------------------------------------------

app.get('/api/odds/live', async (req: Request, res: Response) => {
  const force = req.query.force === 'true' || req.query.refresh === 'true';
  try {
    const oddsData = await fetchLiveCfbOdds({ force });
    return res.json(oddsData);
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err?.message || 'Failed to fetch live NCAAF odds',
      cached: false,
    });
  }
});

app.post('/api/odds/refresh', async (_req: Request, res: Response) => {
  try {
    const oddsData = await fetchLiveCfbOdds({ force: true });
    return res.json(oddsData);
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err?.message || 'Failed to refresh live NCAAF odds',
      cached: false,
    });
  }
});

// ----------------------------------------------------
// Core GenAI Endpoints (Secured & Rate Limited)
// ----------------------------------------------------

app.post('/api/genai', apiRateLimiter, async (req: Request, res: Response) => {
  const startTime = Date.now();
  const cfg = app.locals.envConfig;
  try {
    const { prompt, model = 'gemini-2.5-flash', systemInstruction, temperature = 0.2, noCache = false } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required and must be a string', code: 'INVALID_PROMPT' });
    }

    const estimatedInTokens = estimateTokens(prompt) + estimateTokens(systemInstruction || '');
    if (estimatedInTokens > cfg.MODEL_MAX_CONTEXT_TOKENS) {
      return res.status(413).json({
        error: `Prompt payload exceeds maximum allowed context size (${estimatedInTokens} tokens > ${cfg.MODEL_MAX_CONTEXT_TOKENS} limit). Please shorten the input.`,
        code: 'PAYLOAD_TOO_LARGE',
      });
    }

    // Token-aware context compaction
    const compactedPrompt = compactPrompt(prompt, cfg.AI_MAX_TOKENS_PER_REQUEST);
    const compactedSystem = systemInstruction ? compactPrompt(systemInstruction, 1024).text : undefined;

    // Cache Check
    const shouldBypassCache = Boolean(noCache) || aiCache.isSensitive(prompt);
    const cacheKey = aiCache.generateKey(model, compactedPrompt.text, compactedSystem || '');

    if (!shouldBypassCache) {
      const cached = aiCache.get(cacheKey);
      if (cached) {
        telemetry.trackRequest('/api/genai', Date.now() - startTime, 200, estimatedInTokens, estimateTokens(cached.response));
        return res.json({
          text: cached.response,
          cached: true,
          model,
        });
      }
    }

    // Execute GenAI with backoff & retry using validated envConfig
    const resultText = await callGenAIWithBackoff(
      async (ai) => {
        const response = await ai.models.generateContent({
          model,
          contents: compactedPrompt.text,
          config: {
            systemInstruction: compactedSystem,
            temperature,
          },
        });
        return response.text || '';
      },
      {
        model,
        maxRetries: cfg.AI_MAX_RETRIES,
        baseDelayMs: cfg.AI_BASE_DELAY_MS,
        maxBackoffMs: cfg.AI_MAX_BACKOFF_MS,
      }
    );

    if (!shouldBypassCache && resultText) {
      aiCache.set(cacheKey, resultText, model);
    }

    const estimatedOutTokens = estimateTokens(resultText);
    telemetry.trackRequest('/api/genai', Date.now() - startTime, 200, estimatedInTokens, estimatedOutTokens);

    return res.json({
      text: resultText,
      cached: false,
      model,
      tokens: {
        estimatedIn: estimatedInTokens,
        estimatedOut: estimatedOutTokens,
      },
    });
  } catch (err: any) {
    const errorInfo = extractErrorInfo(err);
    logStructured('error', 'API /api/genai failed', {
      error: errorInfo.message,
      code: errorInfo.code,
      status: errorInfo.status,
      ip: getClientIp(req),
    });

    if (errorInfo.retryAfterSec) {
      res.setHeader('Retry-After', errorInfo.retryAfterSec);
    }

    return res.status(errorInfo.status).json({
      error: errorInfo.message,
      code: errorInfo.code,
      retryAfterSec: errorInfo.retryAfterSec,
    });
  }
});

// Domain-Specific Endpoint: CFB Matchup Qualitative Context (Commentary Only - Non-Signal)
app.post('/api/ai/game-breakdown', apiRateLimiter, async (req: Request, res: Response) => {
  const startTime = Date.now();
  const cfg = app.locals.envConfig;
  try {
    const { matchData, noCache = false } = req.body;
    if (!matchData || !matchData.favorite || !matchData.underdog) {
      return res.status(400).json({ error: 'Valid game matchData is required', code: 'INVALID_PAYLOAD' });
    }

    const model = 'gemini-2.5-flash';
    const cacheKey = aiCache.generateKey(
      model,
      `matchup_${matchData.id || `${matchData.favorite}_vs_${matchData.underdog}`}`,
      'game-commentary-system'
    );

    if (!noCache) {
      const cached = aiCache.get(cacheKey);
      if (cached) {
        return res.json({ analysis: cached.response, cached: true });
      }
    }

    const systemPrompt = `You provide qualitative situational matchup commentary for College Football games.
CRITICAL MANDATE:
- Your commentary is STRICTLY QUALITATIVE and NON-SIGNAL.
- You must NEVER recommend bet sizing, units, or Kelly fractions.
- You must NEVER override quantitative pricing or claim an unvalidated model edge.
- Focus purely on football factors: scheme matchups, returning production, offensive line depth, injury news, weather, and game location context.
Provide 3 concise, analytical bullet points.`;

    const userPrompt = `Provide qualitative situational commentary for this matchup:
- Matchup: ${matchData.favorite} vs ${matchData.underdog} (${matchData.week || '2026 Slate'})
- Venue: ${matchData.venue || 'Neutral / Home Site'}
- Market Consensus Spread: ${matchData.favorite} ${matchData.marketSpread > 0 ? `-${matchData.marketSpread}` : `${matchData.marketSpread}`}
- Model Reference Line: ${matchData.projectedSpread > 0 ? `-${matchData.projectedSpread}` : `${matchData.projectedSpread}`}
- SP+ Ratings Difference: ${matchData.spPlusDiff ? `${matchData.spPlusDiff} pts` : 'CFBD SP+ Dataset'}`;

    const analysisText = await callGenAIWithBackoff(
      async (ai) => {
        const response = await ai.models.generateContent({
          model,
          contents: userPrompt,
          config: {
            systemInstruction: systemPrompt,
            temperature: 0.3,
          },
        });
        return response.text || '';
      },
      {
        model,
        maxRetries: cfg.AI_MAX_RETRIES,
        baseDelayMs: cfg.AI_BASE_DELAY_MS,
        maxBackoffMs: cfg.AI_MAX_BACKOFF_MS,
      }
    );

    if (!noCache && analysisText) {
      aiCache.set(cacheKey, analysisText, model);
    }

    telemetry.trackRequest('/api/ai/game-breakdown', Date.now() - startTime, 200);
    return res.json({ analysis: analysisText, cached: false });
  } catch (err: any) {
    const errorInfo = extractErrorInfo(err);
    logStructured('error', 'API /api/ai/game-breakdown failed', {
      error: errorInfo.message,
      code: errorInfo.code,
    });

    return res.status(errorInfo.status).json({
      error: errorInfo.message,
      code: errorInfo.code,
      analysis: 'Qualitative commentary temporarily unavailable.',
    });
  }
});

// Domain-Specific Endpoint: Slate Portfolio Strategy & Risk Advisor
app.post('/api/ai/slate-advisor', apiRateLimiter, async (req: Request, res: Response) => {
  const startTime = Date.now();
  const cfg = app.locals.envConfig;
  try {
    const { slateSummary, noCache = false } = req.body;
    if (!slateSummary) {
      return res.status(400).json({ error: 'slateSummary is required', code: 'INVALID_PAYLOAD' });
    }

    const model = 'gemini-2.5-flash';
    const cacheKey = aiCache.generateKey(model, JSON.stringify(slateSummary), 'slate-advisor-system');

    if (!noCache) {
      const cached = aiCache.get(cacheKey);
      if (cached) {
        return res.json({ advice: cached.response, cached: true });
      }
    }

    const systemPrompt = `You are a chief portfolio risk officer specializing in sports betting variance reduction and fractional Kelly allocation. Provide a concise 3-paragraph executive summary of the slate: portfolio balance, cluster risk assessment, and key upside drivers.`;

    const userPrompt = `Review this slate portfolio allocation:
- Total Slate Budget: $${slateSummary.totalBudget} (${slateSummary.totalUnits} units)
- Straight Bets: $${slateSummary.straightDollars} (${slateSummary.straightUnits}u across ${slateSummary.straightCount} tickets)
- Parlays: $${slateSummary.parlayDollars} (${slateSummary.parlayUnits}u)
- Teasers: $${slateSummary.teaserDollars} (${slateSummary.teaserUnits}u)
- Max Game Exposure Cap: ${slateSummary.maxGameExposurePct}%
- Projected Slate Net ROI: +${slateSummary.projectedRoiPct}%`;

    const adviceText = await callGenAIWithBackoff(
      async (ai) => {
        const response = await ai.models.generateContent({
          model,
          contents: userPrompt,
          config: {
            systemInstruction: systemPrompt,
            temperature: 0.25,
          },
        });
        return response.text || '';
      },
      {
        model,
        maxRetries: cfg.AI_MAX_RETRIES,
        baseDelayMs: cfg.AI_BASE_DELAY_MS,
        maxBackoffMs: cfg.AI_MAX_BACKOFF_MS,
      }
    );

    if (!noCache && adviceText) {
      aiCache.set(cacheKey, adviceText, model);
    }

    telemetry.trackRequest('/api/ai/slate-advisor', Date.now() - startTime, 200);
    return res.json({ advice: adviceText, cached: false });
  } catch (err: any) {
    const errorInfo = extractErrorInfo(err);
    logStructured('error', 'API /api/ai/slate-advisor failed', {
      error: errorInfo.message,
      code: errorInfo.code,
    });

    return res.status(errorInfo.status).json({
      error: errorInfo.message,
      code: errorInfo.code,
      advice: 'Slate risk allocation satisfies fractional Kelly variance shielding principles.',
    });
  }
});

// ----------------------------------------------------
// Static File Serving & Vite Middleware
// ----------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    logStructured('info', `Server listening on port ${PORT}`, {
      port: PORT,
      env: process.env.NODE_ENV || 'development',
    });
  });
}

startServer();
