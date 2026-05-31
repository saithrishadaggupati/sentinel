import dotenv from 'dotenv';
dotenv.config();

import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import crypto from 'crypto';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: API Keys
 *   description: Generate, list, and revoke API keys
 */

/**
 * @swagger
 * /keys/generate:
 *   post:
 *     summary: Generate a new API key
 *     tags: [API Keys]
 *     description: Once the user is authenticated, the backend generates a new API key, stores it in the database, and links it to that user. The key is returned so they can use it immediately, and any activity made with that key shows up on the dashboard in real time.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - name
 *             properties:
 *               userId:
 *                 type: integer
 *                 example: 1
 *               name:
 *                 type: string
 *                 example: My Production Key
 *     responses:
 *       201:
 *         description: Returns the full key — store it immediately as this is the only time it's returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: API key created
 *                 apiKey:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     key:
 *                       type: string
 *                       example: sk_abc123...
 *                     name:
 *                       type: string
 *                       example: My Production Key
 *       400:
 *         description: userId and name are required
 *       404:
 *         description: User not found
 */
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

/**
 * @swagger
 * /keys/user/{userId}:
 *   get:
 *     summary: List all API keys for a user
 *     tags: [API Keys]
 *     description: The main purpose is to populate the dashboard. When a user logs in, the frontend calls this endpoint to get all their API keys so they can see which ones are active, revoke old ones, and monitor usage without having to make multiple requests.
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: List of API keys
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 apiKeys:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       plan:
 *                         type: string
 *                       isActive:
 *                         type: boolean
 *                       requests:
 *                         type: integer
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *       500:
 *         description: Internal server error
 */
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

/**
 * @swagger
 * /keys/{id}:
 *   delete:
 *     summary: Revoke an API key
 *     tags: [API Keys]
 *     description: Doesn't delete the key — just marks it as revoked in the database. From that point on, any request using that key gets blocked. The dashboard updates immediately so the user can see the key is no longer active. Went with revoke over delete because you still have a record of the key and its history, which is useful if you ever need to audit what happened later.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: API key revoked
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: API key revoked
 *       500:
 *         description: Internal server error
 */
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