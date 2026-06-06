import { Request, Response, NextFunction } from 'express';
import { prisma, redisClient } from '../config/database';

const PLAN_LIMITS: Record<string, number> = {
  FREE: 100,
  BASIC: 1000,
  PRO: 10000,
};

const WINDOW_SECONDS = 60 * 60;

const PUBLIC_ROUTES = ['/', '/api/test', '/api-docs', '/auth/google', '/auth/google/callback', '/auth/failed', '/auth/logout'];

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
    const current = await redisClient.incr(redisKey);

    if (current === 1) {
      await redisClient.expire(redisKey, WINDOW_SECONDS);
    }

    const ttl = await redisClient.ttl(redisKey);
    const resetTime = Math.floor(Date.now() / 1000) + ttl;

    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - current));
    res.setHeader('X-RateLimit-Reset', resetTime);
    res.setHeader('X-RateLimit-Plan', plan);

    if (current > limit) {
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
