export { PrismaClient, Prisma } from '@prisma/client';
export { prisma, PrismaService } from './prisma.service';
export { discoverTrends } from './discover-trends';
export type { DiscoverTrendsResult } from './discover-trends';
export { generateArticle, buildMockArticleContent } from './generate-article';
export type { GenerateArticleResult, ArticleOutlineSection } from './generate-article';
export { generateArticleIdeaFromTopic } from './generate-idea-from-topic';
export type { GenerateIdeaFromTopicResult } from './generate-idea-from-topic';
export {
  embedCandidateTexts,
  generateArticleEmbeddings,
} from './embedding/generate-article-embeddings';
export type { GenerateArticleEmbeddingsResult } from './embedding/generate-article-embeddings';
export {
  DEFAULT_DUPLICATE_THRESHOLDS,
  getDuplicateSettings,
  updateDuplicateSettings,
} from './duplicate-engine/duplicate-settings';
export type { DuplicateThresholdSettings } from './duplicate-engine/duplicate-settings';
export {
  PROMPT_TEMPLATE_KEYS,
  DEFAULT_PROMPT_DEFINITIONS,
  getDefaultPromptDefinition,
  listPromptTemplates,
  getPromptTemplateById,
  upsertPromptTemplate,
  updatePromptTemplate,
  deletePromptTemplate,
  ensureDefaultPromptTemplates,
  resetPromptTemplateToDefault,
  getPromptCatalog,
  savePromptByKey,
  resetPromptByKey,
} from './prompt-templates';
export type { PromptTemplateRecord, UpsertPromptTemplateInput } from './prompt-templates';
export { checkPrePublishDuplicates } from './duplicate-engine/check-pre-publish';
export { registerCanonicalTopic } from './duplicate-engine/register-canonical-topic';
export { runArticleSeoEnrichment } from './generate-article-seo';
export { runDailyPublishingPipeline } from './publishing/run-daily-pipeline';
export type { DailyPipelineResult } from './publishing/run-daily-pipeline';
export { searchArticles } from './search-articles';
export type {
  SearchArticlesInput,
  SearchArticlesResult,
  SearchArticleHit,
} from './search-articles';
export { computeArticleRelated } from './compute-article-related';
export type { ComputeRelatedArticlesResult } from './compute-article-related';
export { getAdminDashboardMetrics } from './admin-dashboard-metrics';
export type { AdminDashboardMetrics } from './admin-dashboard-metrics';
export { seed } from './seed';
