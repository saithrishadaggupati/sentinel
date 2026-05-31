import dotenv from 'dotenv';
dotenv.config();

import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import crypto from 'crypto';

const router = Router();

// Generate a new API key
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { userId, name } = req.body;

    if (!userId || !name) {
      res.status(400).json({ error: 'userId and name are required' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: Number(userId) } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const key = `sk_${crypto.randomBytes(32).toString('hex')}`;

    const apiKey = await prisma.apiKey.create({
      data: {
        key,
        name,
        userId: Number(userId),
      },
    });

    res.status(201).json({ message: 'API key created', apiKey });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// List all API keys for a user
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const apiKeys = await prisma.apiKey.findMany({
      where: { userId: Number(userId) },
      select: {
        id: true,
        name: true,
        plan: true,
        isActive: true,
        requests: true,
        createdAt: true,
      },
    });

    res.json({ apiKeys });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Revoke an API key
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.apiKey.update({
      where: { id: Number(id) },
      data: { isActive: false },
    });

    res.json({ message: 'API key revoked' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;