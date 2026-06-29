export { PrismaClient, Prisma } from '@prisma/client';
export type {
  User,
  Category,
  Article,
  TrendingTopic,
  ArticleIdea,
  AiJob,
  AuditLog,
} from '@prisma/client';
export { prisma, PrismaService } from './prisma.service';
export { discoverMockTrends } from './discover-mock-trends';
export {
  generateArticle,
  generateMockArticle,
  buildMockArticleContent,
} from './generate-mock-article';
export type {
  GenerateArticleResult,
  GenerateMockArticleResult,
  ArticleOutlineSection,
} from './generate-mock-article';
export { seed } from './seed';
