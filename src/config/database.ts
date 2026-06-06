import { PrismaClient } from '@prisma/client';
import { createClient } from 'redis';

export const prisma = new PrismaClient();

export const redisClient = createClient({
  url: process.env.REDIS_URL
});

redisClient.on('error', (err) => console.error('Redis error:', err));

export const connectRedis = async () => {
  await redisClient.connect();
  console.log('Redis connected');
};
