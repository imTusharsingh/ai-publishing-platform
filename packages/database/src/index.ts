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
export { discoverTrends, discoverMockTrends } from './discover-trends';
export type { DiscoverTrendsResult } from './discover-trends';
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
export { generateArticleIdeaFromTopic } from './generate-idea-from-topic';
export type { GenerateIdeaFromTopicResult } from './generate-idea-from-topic';
export {
  generateArticleEmbeddings,
  embedCandidateTexts,
} from './embedding/generate-article-embeddings';
export type { GenerateArticleEmbeddingsResult } from './embedding/generate-article-embeddings';
export { findSimilarArticles, vectorToPgLiteral } from './embedding/embedding-similarity';
export type {
  FindSimilarArticlesInput,
  SimilarArticleMatch,
} from './embedding/embedding-similarity';
export { seed } from './seed';
