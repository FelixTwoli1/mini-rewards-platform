export * from '@prisma/client';
export { PrismaClient } from '@prisma/client';

import { PrismaClient } from '@prisma/client';
import { logger } from '@rewards/logger';

export const prisma = new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
    {
      emit: 'event',
      level: 'error',
    },
    {
      emit: 'event',
      level: 'warn',
    },
  ],
});

prisma.$on('query', (e) => {
  logger.debug(
    {
      duration: e.duration,
      query: e.query,
      params: e.params,
    },
    'Query executed'
  );
});

prisma.$on('error', (e) => {
  logger.error(
    {
      message: e.message,
      target: e.target,
    },
    'Database error'
  );
});

export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info('Database connected successfully');
  } catch (error) {
    logger.error(error, 'Failed to connect to database');
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  logger.info('Database disconnected');
}

export default prisma;
