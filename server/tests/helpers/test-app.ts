import type { Express } from 'express';
import { prisma } from '../../src/config/database';
import { createApp } from '../../src/app';
import type { Container } from '../../src/container';

export interface TestAppHandle {
  app: Express;
  container: Container;
}

export function buildTestApp(): TestAppHandle {
  const { app, container } = createApp({ prisma });
  return { app, container };
}
