import { PrismaClient } from '@prisma/client';
import { env, isProduction } from './env';

export const prisma = new PrismaClient({
  log: isProduction ? ['error'] : ['warn', 'error'],
  datasources: {
    db: { url: env.DATABASE_URL },
  },
});

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}
