import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { connectMongo, connectRedis } from './config/database';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({
    message: 'Sentinel is running 🛡️',
    version: '1.0.0',
    status: 'healthy'
  });
});

// Start server
const start = async () => {
  try {
    await connectMongo();
    await connectRedis();
    app.listen(PORT, () => {
      console.log(`Sentinel running on port ${PORT} 🛡️`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

start();

export default app;