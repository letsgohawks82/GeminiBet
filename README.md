# BCFP2: FEI Quantitative Betting Terminal & 2026 Model Slate Engine

A full-stack quantitative analytics platform for College Football betting based on the Fremeau Efficiency Index (FEI). Features historical backtesting across 4,800+ games, optimal fractional Kelly bet sizing, slate portfolio risk optimization, self-retraining hyperparameter tuning, and a server-side Gemini GenAI quantitative edge analyst.

---

## 🔒 Production Security Architecture

1. **Server-Side GenAI Client Isolation**:
   - Google GenAI SDK (`@google/genai`) is executed strictly server-side in Express (`server.ts` and `server/aiProxy.ts`).
   - Zero `VITE_*` API keys in client-side code; sensitive secrets are never bundled into client assets.
   - All errors pass through an automated key redactor (`[REDACTED_API_KEY]`) preventing secret leakage in response bodies or log streams.

2. **Distributed & In-Memory Rate Limiting**:
   - Express rate-limiter with true client IP resolution (`x-forwarded-for` first IP parsing).
   - Seamless transition to Redis (`rate-limit-redis`) when `REDIS_URL` is supplied in multi-pod deployments.
   - Standard `Retry-After`, `X-RateLimit-Limit`, and `X-RateLimit-Remaining` response headers.

3. **Deterministic SHA-256 Hashed LRU Cache**:
   - Fast cache lookup utilizing cryptographically hashed keys (`[model, systemInstruction, prompt]`).
   - Strict PII/sensitive content filters and explicit `noCache` parameter support.
   - Configurable TTL (`AI_CACHE_TTL_SEC`) and entry caps.

4. **Token-Aware Prompt Compaction**:
   - Real-time token estimation with hard context budget enforcement (`MODEL_MAX_CONTEXT_TOKENS` and `AI_MAX_TOKENS_PER_REQUEST`).
   - Context compression preserving essential quantitative matchup stats while trimming older context.

---

## ⚙️ Environment Variables Reference

| Variable | Default | Description |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | *(Required for AI)* | Google Gemini API key used server-side only. |
| `ALLOWED_ORIGINS` | `http://localhost:5173,https://app.bcftoys.com` | Comma-separated list of allowed web origins for CORS. |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Rate limiter rolling window duration in ms (1 min). |
| `RATE_LIMIT_MAX_REQUESTS`| `45` | Max allowed requests per window per IP address. |
| `REDIS_URL` | *(Optional)* | Redis connection string for cluster rate limiting. |
| `AI_MAX_RETRIES` | `4` | Max retry attempts for transient AI errors (429/503). |
| `AI_BASE_DELAY_MS` | `600` | Base exponential backoff delay in ms. |
| `AI_MAX_BACKOFF_MS` | `60000` | Maximum backoff delay cap in ms. |
| `AI_CACHE_TTL_SEC` | `600` | Cache time-to-live in seconds (10 minutes). |
| `AI_CACHE_MAX_ITEMS` | `250` | Maximum LRU cache item capacity. |
| `AI_MAX_TOKENS_PER_REQUEST`| `3000` | Target token budget before prompt compaction. |
| `MODEL_MAX_CONTEXT_TOKENS`| `32768` | Maximum allowable payload token limit (413 protection). |

---

## 🚀 Local Development & Build Commands

```bash
# 1. Install dependencies
npm install

# 2. Run typecheck & lint
npm run lint

# 3. Execute unit & integration tests
npm test

# 4. Start local development server (Vite + Express)
npm run dev

# 5. Compile production bundle & server
npm run build

# 6. Run standalone production server
npm start
```

---

## 🐳 Docker & Container Deployment

### Running with Docker Compose:
```bash
# Launches Express Server + Redis instance with automatic healthchecks
docker-compose up --build -d
```

### Standalone Docker Build:
```bash
docker build -t bcfp2-app:latest .
docker run -p 3000:3000 -e GEMINI_API_KEY="your-key-here" bcfp2-app:latest
```

---

## 📊 Observability & Health Endpoints

- **`GET /api/health`**: Returns system status, environment, uptime, AI configuration state, cache statistics (hits, misses, hit rate), and aggregated telemetry metrics.
- **`GET /api/metrics`**: Detailed endpoint-level throughput, latency, error counts, rate limit hits, and estimated token counters.

---

## 🧪 QA & Verification Runbook

1. **Verify Secret Security**:
   ```bash
   npm run build
   grep -rn "AIzaSy" dist/assets/ || echo "Verified: Zero API keys in client build"
   ```
2. **Verify Rate Limiting**:
   - Send rapid repeated requests to `/api/genai` or `/api/ai/game-breakdown`.
   - Confirm status code `429` is returned with `Retry-After` header.
3. **Verify Request Cancellation**:
   - In the 2026 Recommended Picks view, open **AI Matchup Breakdown** on any game.
   - Click **Cancel Request** or close the modal immediately.
   - Confirm in network logs that the request was aborted without React memory leaks.
