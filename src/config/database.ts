import { PrismaClient } from '@prisma/client';
import { env } from './env';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

// Prevent multiple Prisma Client instances in development (hot reload)
const prisma = global.__prisma || new PrismaClient({
  log: env.isDev() ? ['warn', 'error'] : ['error'],
});

if (env.isDev()) {
  global.__prisma = prisma;
}

export { prisma };
export default prisma;
