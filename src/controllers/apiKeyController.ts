import { Request, Response } from 'express';
import { prisma } from '../config/database';
import crypto from 'crypto';

export const generateKey = async (req: Request, res: Response) => {
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
    const key = 'sk_' + crypto.randomBytes(32).toString('hex');
    const apiKey = await prisma.apiKey.create({
      data: { key, name, userId: Number(userId) },
    });
    res.status(201).json({ message: 'API key created', apiKey });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUserKeys = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const apiKeys = await prisma.apiKey.findMany({
      where: { userId: Number(userId) },
      select: { id: true, name: true, plan: true, isActive: true, requests: true, createdAt: true },
    });
    res.json({ apiKeys });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const revokeKey = async (req: Request, res: Response) => {
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
};
