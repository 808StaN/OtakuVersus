import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from '../config/env';
import { errorHandler } from '../middleware/error-handler';
import { notFoundHandler } from '../middleware/not-found';
import { apiRouter } from './router';

export function createApp() {
  const app = express();
  const allowedOrigins = [env.CLIENT_URL];
  if (env.NODE_ENV === 'development') {
    // Vite dev server sometimes runs on 5173 or 5174 depending on environment
    allowedOrigins.push('http://localhost:5173', 'http://localhost:5174');
  }

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error('CORS origin not allowed'), false);
      },
      credentials: true
    })
  );
  app.use(helmet());
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
  app.use(express.json({ limit: '1mb' }));

  app.use('/api', apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
