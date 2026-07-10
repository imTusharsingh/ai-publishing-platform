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
export {
  DEFAULT_DUPLICATE_THRESHOLDS,
  getDuplicateSettings,
  updateDuplicateSettings,
} from './duplicate-engine/duplicate-settings';
export type { DuplicateThresholdSettings } from './duplicate-engine/duplicate-settings';
export {
  PROMPT_TEMPLATE_KEYS,
  DEFAULT_FEATURED_IMAGE_PROMPT,
  DEFAULT_PROMPT_DEFINITIONS,
  getDefaultPromptDefinition,
  renderPromptTemplate,
  resolvePromptTemplate,
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
  getResolvedPromptBodies,
  resolveArticleWriterPrompts,
  resolveIdeaPlanningPrompts,
  resolveContentPlanningPrompts,
  resolveTrendDiscoveryPrompts,
  resolveQualityScoringPrompts,
  resolveSeoGenerationPrompts,
  resolveFeaturedImagePrompt,
  resolveArticleImageSuggestionPrompts,
} from './prompt-templates';
export type { DefaultPromptDefinition, PromptTemplateKey } from './prompt-templates/defaults';
export type { PromptTemplateRecord, UpsertPromptTemplateInput } from './prompt-templates';
export { checkPrePublishDuplicates } from './duplicate-engine/check-pre-publish';
export { registerCanonicalTopic } from './duplicate-engine/register-canonical-topic';
export { checkLayer2Semantic } from './duplicate-engine/layer2';
export { checkLayer3TopicCluster } from './duplicate-engine/layer3';
export { runArticleQualityGate } from './validate-article-quality';
export type { RunArticleQualityGateResult } from './validate-article-quality';
export { runArticleSeoEnrichment } from './generate-article-seo';
export type { GenerateArticleSeoResult } from './generate-article-seo';
export { ensureContentPlanForIdea } from './generate-content-plan';
export type { RunContentPlanningResult } from './generate-content-plan';
export { runArticleFeaturedImageEnrichment } from './generate-article-featured-image';
export type { GenerateArticleFeaturedImageResult } from './generate-article-featured-image';
export { runArticleImageSuggestionEnrichment } from './generate-article-image-suggestions';
export type { GenerateArticleImageSuggestionsResult } from './generate-article-image-suggestions';
export { runArticleInlineImageEnrichment } from './generate-article-inline-images';
export type { GenerateArticleInlineImagesResult } from './generate-article-inline-images';
export {
  getArticleMediaDirectory,
  buildFeaturedImagePublicPath,
  buildInlineImagePublicPath,
  saveArticleMediaFile,
  saveInlineArticleMediaFile,
} from './article-media';
export { autoPublishArticle } from './publishing/auto-publish-article';
export type { AutoPublishArticleResult } from './publishing/auto-publish-article';
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
