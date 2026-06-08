import { Registry, collectDefaultMetrics, Counter, Histogram } from 'prom-client';

export const register = new Registry();

collectDefaultMetrics({ register });

export const httpRequestCounter = new Counter({
  name: 'sentinel_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [register],
});

export const httpRequestDuration = new Histogram({
  name: 'sentinel_http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers: [register],
});

export const rateLimitHits = new Counter({
  name: 'sentinel_rate_limit_hits_total',
  help: 'Total number of rate limit hits',
  labelNames: ['plan'],
  registers: [register],
});