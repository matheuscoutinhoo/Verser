import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import { resolve } from 'node:path';
import { pinoHttp } from 'pino-http';
import { env, isProduction, isTest } from './config/env';
import { logger } from './config/logger';
import { createContainer, type Container, type ContainerOverrides } from './container';
import { createAuthMiddleware } from './layers/middlewares/auth.middleware';
import { errorHandler } from './layers/middlewares/error-handler.middleware';
import { generalRateLimiter } from './layers/middlewares/rate-limit.middleware';
import { notFoundHandler } from './layers/middlewares/not-found.middleware';
import { createApiRouter } from './layers/routes';

export interface AppFactoryResult {
  app: Express;
  container: Container;
}

export function createApp(overrides: ContainerOverrides = {}): AppFactoryResult {
  const app = express();
  const container = createContainer(overrides);

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(
    helmet({
      contentSecurityPolicy: isProduction
        ? {
            useDefaults: true,
            directives: {
              defaultSrc: ["'self'"],
              imgSrc: ["'self'", 'data:', 'https:'],
              connectSrc: ["'self'", env.CLIENT_URL],
            },
          }
        : false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      hsts: isProduction ? undefined : false,
    }),
  );

  app.use(
    cors({
      origin: [env.CLIENT_URL],
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    }),
  );

  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true, limit: '5mb' }));
  app.use(cookieParser());

  if (!isTest) {
    app.use(pinoHttp({ logger }));
  }

  app.use(generalRateLimiter);

  // Serve uploaded files. In production this should be moved to S3/CDN.
  app.use('/uploads', express.static(resolve(process.cwd(), env.UPLOAD_DIR)));

  const authenticate = createAuthMiddleware(container.tokenService, container.userRepo);
  app.use('/api', createApiRouter(container, authenticate));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return { app, container };
}
