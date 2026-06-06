import { createApp } from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { disconnectDatabase } from './config/database';

const { app } = createApp();

const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT, env: env.NODE_ENV }, 'Verser API listening');
});

async function shutdown(signal: string): Promise<void> {
  logger.info({ signal }, 'Shutting down...');
  server.close(async (err) => {
    if (err) {
      logger.error({ err }, 'Error during server shutdown');
    }
    await disconnectDatabase();
    process.exit(err ? 1 : 0);
  });
  setTimeout(() => {
    logger.warn('Force-exiting after 10s');
    process.exit(1);
  }, 10_000).unref();
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'unhandledRejection');
});

process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'uncaughtException');
  void shutdown('uncaughtException');
});
