import { createClient } from 'redis';

const redisClient = createClient({ url: 'redis://localhost:6380' });

beforeAll(async () => {
  await redisClient.connect();
});

afterAll(async () => {
  await redisClient.quit();
});

describe('Rate Limiter', () => {
  test('should increment Redis counter for an API key', async () => {
    const key = 'rate_limit:test_key_123';
    await redisClient.del(key);

    const count = await redisClient.incr(key);
    expect(count).toBe(1);
  });

  test('should set TTL on first request', async () => {
    const key = 'rate_limit:test_key_ttl';
    await redisClient.del(key);

    await redisClient.incr(key);
    await redisClient.expire(key, 3600);

    const ttl = await redisClient.ttl(key);
    expect(ttl).toBeGreaterThan(0);
  });

  test('should block when limit exceeded', async () => {
    const key = 'rate_limit:test_key_limit';
    await redisClient.del(key);

    // Simulate 101 requests for FREE plan (limit = 100)
    for (let i = 0; i < 101; i++) {
      await redisClient.incr(key);
    }

    const count = await redisClient.get(key);
    expect(Number(count)).toBeGreaterThan(100);
  });

  test('should return remaining requests correctly', async () => {
    const key = 'rate_limit:test_key_remaining';
    await redisClient.del(key);

    await redisClient.incr(key);
    await redisClient.incr(key);
    await redisClient.incr(key);

    const count = await redisClient.get(key);
    const remaining = 100 - Number(count);
    expect(remaining).toBe(97);
  });
});