import express from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './swagger';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import session from 'express-session';
import passport from 'passport';
import { connectMongo, connectRedis } from './config/database';
import { rateLimiter } from './middleware/rateLimiter';
import authRouter from './routes/auth';
import apiKeysRouter from './routes/apiKeys';
import { initWebSocket } from './services/websocket';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(helmet({ contentSecurityPolicy: false }));
app.use(morgan('dev'));
app.use(express.json());
app.use(rateLimiter);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCssUrl: 'https://unpkg.com/swagger-ui-dist@5/swagger-ui.css',
  customJs: [
    'https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js',
    'https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js',
  ],
}));
app.use(session({
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());

app.get('/', (req, res) => {
  res.json({ message: 'Sentinel is running', version: '1.0.0', status: 'healthy' });
});

app.use('/auth', authRouter);
app.use('/api/keys', apiKeysRouter);

app.get('/api/test', (req, res) => {
  res.json({ message: 'API route reached' });
});

const start = async () => {
  try {
    await connectMongo();
    await connectRedis();
    const server = app.listen(PORT, () => {
      console.log('Sentinel running on port ' + PORT);
    });
    initWebSocket(server);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

start();

export default app;
