import { PrismaClient, PublishFrequency, UserRole } from '@prisma/client';

// Re-export enums for seed module convenience
export { PublishFrequency, UserRole };

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export class PrismaService {
  get client() {
    return prisma;
  }

  async connect() {
    await prisma.$connect();
  }

  async disconnect() {
    await prisma.$disconnect();
  }

  async isHealthy() {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
}
