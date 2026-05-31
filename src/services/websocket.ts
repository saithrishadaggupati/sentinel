import { Server } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { prisma } from '../config/database';

let wss: WebSocketServer;

export function initWebSocket(server: Server) {
  wss = new WebSocketServer({ server });

  wss.on('connection', (ws: WebSocket) => {
    console.log('WebSocket client connected');

    // Send current stats immediately on connect
    sendStats(ws);

    // Send stats every 5 seconds
    const interval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        sendStats(ws);
      }
    }, 5000);

    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      clearInterval(interval);
    });

    ws.on('error', (err) => {
      console.error('WebSocket error:', err);
      clearInterval(interval);
    });
  });

  console.log('WebSocket server initialized');
}

async function sendStats(ws: WebSocket) {
  try {
    const [totalUsers, totalKeys, activeKeys, totalRequests] = await Promise.all([
      prisma.user.count(),
      prisma.apiKey.count(),
      prisma.apiKey.count({ where: { isActive: true } }),
      prisma.apiKey.aggregate({ _sum: { requests: true } }),
    ]);

    const stats = {
      type: 'stats',
      data: {
        totalUsers,
        totalKeys,
        activeKeys,
        totalRequests: totalRequests._sum.requests ?? 0,
        timestamp: new Date().toISOString(),
      },
    };

    ws.send(JSON.stringify(stats));
  } catch (err) {
    console.error('Error fetching stats:', err);
  }
}