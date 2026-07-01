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
export {
  checkIdeaDuplicates,
  duplicateCheckResultToJson,
} from './duplicate-engine/check-idea-duplicates';
export { checkLayer1Exact, logDuplicateRejection } from './duplicate-engine/layer1';
export { checkLayer4Canonical } from './duplicate-engine/layer4';
export { normalizeText, buildTopicKey } from './duplicate-engine/normalize-text';
export type {
  DuplicateCheckOutcome,
  IdeaDuplicateCandidate,
  LayerCheckResult,
  PublishDuplicateCandidate,
} from './duplicate-engine/types';
export { seed } from './seed';
