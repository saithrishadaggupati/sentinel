import { rateLimitHits } from '../metrics';
import { Request, Response, NextFunction } from 'express';
import { prisma, redisClient } from '../config/database';

const PLAN_LIMITS: Record<string, number> = {
  FREE: 100,
  BASIC: 1000,
  PRO: 10000,
};

const WINDOW_SECONDS = 60 * 60;

const PUBLIC_ROUTES = ['/', '/api/test', '/api-docs', '/auth/google', '/auth/google/callback', '/auth/failed', '/auth/logout', '/metrics'];

export function rateLimiter(req: Request, res: Response, next: NextFunction): void {
  handleRateLimit(req, res, next).catch(next);
}

async function handleRateLimit(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const isPublic = PUBLIC_ROUTES.some(route => req.path === route || req.path.startsWith('/api-docs'));
    if (isPublic) {
      next();
      return;
    }

    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
      // IP-based rate limiting for unauthenticated requests — prevents DDoS
      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      const ipKey = `rate_limit:ip:${ip}`;

      const ipResult = await redisClient.eval(`
        local current = redis.call('INCR', KEYS[1])
        if current == 1 then
          redis.call('EXPIRE', KEYS[1], ARGV[1])
        end
        return current
      `, {
        keys: [ipKey],
        arguments: ['60'],
      }) as number;

      if (ipResult > 20) {
        res.status(429).json({ error: 'Too many requests from this IP. Please provide an API key.' });
        return;
      }

      res.status(401).json({ error: 'Missing API key. Pass it as x-api-key header.' });
      return;
    }

    const keyRecord = await prisma.apiKey.findUnique({ where: { key: apiKey } });
    if (!keyRecord || !keyRecord.isActive) {
      res.status(401).json({ error: 'Invalid or inactive API key.' });
      return;
    }

    const plan = keyRecord.plan;
    const limit = PLAN_LIMITS[plan] ?? PLAN_LIMITS.FREE;
    const redisKey = `rate_limit:${apiKey}`;

    // Atomic Lua script: increment + set expiry in a single network call
    // Prevents race condition where TTL is never set if two requests arrive simultaneously
    const luaScript = `
      local current = redis.call('INCR', KEYS[1])
      if current == 1 then
        redis.call('EXPIRE', KEYS[1], ARGV[1])
      end
      return {current, redis.call('TTL', KEYS[1])}
    `;

    const result = await redisClient.eval(luaScript, {
      keys: [redisKey],
      arguments: [String(WINDOW_SECONDS)],
    }) as [number, number];

    const current = result[0];
    const ttl = result[1];
    const resetTime = Math.floor(Date.now() / 1000) + ttl;

    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - current));
    res.setHeader('X-RateLimit-Reset', resetTime);
    res.setHeader('X-RateLimit-Plan', plan);

    if (current > limit) {
      rateLimitHits.inc({ plan });
      res.status(429).json({
        error: 'Rate limit exceeded.',
        plan,
        limit,
        remaining: 0,
        resetAt: new Date(resetTime * 1000).toISOString(),
      });
      return;
    }

    next();
  } catch (err) {
    console.error('Rate limiter error:', err);
    res.status(500).json({ error: 'Internal server error in rate limiter.' });
  }
}
