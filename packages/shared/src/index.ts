export const PUBLIC_APP_NAME = 'AuraNews';
export const ADMIN_APP_NAME = 'Aura Admin';

export {
  buildIllustrationPlaceholder,
  buildInlineImageFigure,
  countArticleImagePlaceholders,
  escapeArticleHtml,
  parseImageSuggestions,
  replaceArticleImagePlaceholders,
} from './article-html';
export type { ReplaceArticleImagePlaceholdersOptions } from './article-html';

export { auraColors, auraFontSize, auraSpacing, auraTailwindTheme } from './aura-tailwind';

export function formatApiVersion(version: string): string {
  return `v${version}`;
}

export type { AuthMeResponse, AuthTokens, AuthUser, LoginRequest, UserRole } from './auth.types';
export type {
  AuditLogEntry,
  AuditLogListResponse,
  CategoryAdmin,
  CategoryAdminListResponse,
  CategoryRemoveResult,
  CreateCategoryRequest,
  JobStatusEntry,
  PublishFrequency,
  UpdateCategoryRequest,
} from './admin.types';
export type {
  ArticleAdminDetail,
  ArticleAdminListResponse,
  ArticleAdminStatus,
  ArticleAdminSummary,
  GenerateArticleResponse,
  UpdateArticleStatusRequest,
} from './articles-admin.types';
export type {
  ArticleIdeaContentPlan,
  ArticleIdeaListResponse,
  ArticleIdeaOutlineSection,
  ArticleIdeaStatus,
  ArticleIdeaSummary,
  ArticleImageSuggestion,
  CreateArticleIdeaRequest,
  UpdateArticleIdeaStatusRequest,
} from './article-ideas.types';
export type {
  MockTrendInput,
  TopicListResponse,
  TopicStatus,
  TopicSummary,
  TrendSource,
} from './trends.types';
export { MOCK_TREND_BATCH, normalizeTopicTitle } from './trends.types';
export type {
  AdminDashboardMetrics,
  ArticleDetail,
  ArticleListResponse,
  ArticleSearchHit,
  ArticleSearchResponse,
  ArticleSeo,
  ArticleSummary,
  CategoryDetail,
  CategoryListResponse,
  CategorySummary,
  PaginatedMeta,
} from './api.types';
export type {
  CreatePromptTemplateRequest,
  DefaultPromptDefinitionResponse,
  PromptCatalogPrompt,
  PromptCatalogResponse,
  PromptCatalogSection,
  PromptTemplateEntry,
  PromptTemplateKey,
  PromptTemplateListResponse,
  SavePromptTemplateRequest,
  UpdatePromptTemplateRequest,
} from './prompt-templates.types';
export {
  PROMPT_TEMPLATE_DESCRIPTIONS,
  PROMPT_TEMPLATE_KEY_LABELS,
  PROMPT_TEMPLATE_SECTIONS,
  PROMPT_TEMPLATE_VARIABLE_HINTS,
} from './prompt-templates.types';
export { renderPromptTemplate } from './render-prompt-template';
