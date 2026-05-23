import { PrismaClient } from '@prisma/client';

export abstract class BaseRepository {
  constructor(protected readonly prisma: PrismaClient) {}

  protected async executeInTransaction<T>(
    fn: (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => Promise<T>
  ): Promise<T> {
    return this.prisma.$transaction(fn);
  }
}
