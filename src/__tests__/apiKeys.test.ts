import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Test user created once, cleaned up after all tests
let testUserId: number;
let testKeyId: number;

beforeAll(async () => {
  const user = await prisma.user.create({
    data: {
      email: `test_${Date.now()}@sentinel.test`,
      name: 'Test User',
    },
  });
  testUserId = user.id;
});

afterAll(async () => {
  // Clean up test data in correct order (keys before user)
  await prisma.apiKey.deleteMany({ where: { userId: testUserId } });
  await prisma.user.delete({ where: { id: testUserId } });
  await prisma.$disconnect();
});

describe('API Key Generation', () => {
  test('should generate a key with sk_ prefix', async () => {
    const apiKey = await prisma.apiKey.create({
      data: {
        key: `sk_${require('crypto').randomBytes(32).toString('hex')}`,
        name: 'Test Key',
        userId: testUserId,
      },
    });

    testKeyId = apiKey.id;

    expect(apiKey.key).toMatch(/^sk_/);
    expect(apiKey.name).toBe('Test Key');
    expect(apiKey.isActive).toBe(true);
    expect(apiKey.plan).toBe('FREE');
    expect(apiKey.requests).toBe(0);
  });

  test('should link key to correct user', async () => {
    const apiKey = await prisma.apiKey.findUnique({
      where: { id: testKeyId },
      include: { user: true },
    });

    expect(apiKey?.userId).toBe(testUserId);
    expect(apiKey?.user.email).toContain('@sentinel.test');
  });

  test('should not allow duplicate keys', async () => {
    const existingKey = await prisma.apiKey.findUnique({
      where: { id: testKeyId },
    });

    await expect(
      prisma.apiKey.create({
        data: {
          key: existingKey!.key, // same key — should fail unique constraint
          name: 'Duplicate Key',
          userId: testUserId,
        },
      })
    ).rejects.toThrow();
  });
});

describe('API Key Listing', () => {
  test('should return all keys for a user', async () => {
    // Create a second key for the same user
    await prisma.apiKey.create({
      data: {
        key: `sk_${require('crypto').randomBytes(32).toString('hex')}`,
        name: 'Second Key',
        userId: testUserId,
      },
    });

    const keys = await prisma.apiKey.findMany({
      where: { userId: testUserId },
      select: {
        id: true,
        name: true,
        plan: true,
        isActive: true,
        requests: true,
        createdAt: true,
      },
    });

    expect(keys.length).toBeGreaterThanOrEqual(2);
    expect(keys.every((k) => k.isActive === true)).toBe(true);
  });

  test('should not expose raw key value in listing', async () => {
    const keys = await prisma.apiKey.findMany({
      where: { userId: testUserId },
      select: {
        id: true,
        name: true,
        plan: true,
        isActive: true,
        requests: true,
        createdAt: true,
      },
    });

    // key field should not be present — select excludes it
    keys.forEach((k) => {
      expect(k).not.toHaveProperty('key');
    });
  });
});

describe('API Key Revocation', () => {
  test('should mark key as inactive on revoke', async () => {
    await prisma.apiKey.update({
      where: { id: testKeyId },
      data: { isActive: false },
    });

    const revoked = await prisma.apiKey.findUnique({
      where: { id: testKeyId },
    });

    expect(revoked?.isActive).toBe(false);
  });

  test('should preserve key record after revocation', async () => {
    // Key should still exist in DB — not deleted, just deactivated
    const revoked = await prisma.apiKey.findUnique({
      where: { id: testKeyId },
    });

    expect(revoked).not.toBeNull();
    expect(revoked?.key).toMatch(/^sk_/);
  });

  test('revoked key should be excluded from active key queries', async () => {
    const activeKeys = await prisma.apiKey.findMany({
      where: {
        userId: testUserId,
        isActive: true,
      },
    });

    const revokedInActive = activeKeys.find((k) => k.id === testKeyId);
    expect(revokedInActive).toBeUndefined();
  });
});
