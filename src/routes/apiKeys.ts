import { Router } from 'express';
import { generateKey, getUserKeys, revokeKey } from '../controllers/apiKeyController';

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
 *         description: API key created
 *       400:
 *         description: userId and name are required
 *       404:
 *         description: User not found
 */
router.post('/generate', generateKey);

/**
 * @swagger
 * /keys/user/{userId}:
 *   get:
 *     summary: List all API keys for a user
 *     tags: [API Keys]
 *     description: Populates the dashboard with all API keys for a given user.
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
 *       500:
 *         description: Internal server error
 */
router.get('/user/:userId', getUserKeys);

/**
 * @swagger
 * /keys/{id}:
 *   delete:
 *     summary: Revoke an API key
 *     tags: [API Keys]
 *     description: Marks the key as revoked. Does not delete it — keeps the history for auditing.
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
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', revokeKey);

export default router;
