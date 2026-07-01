export const PUBLIC_APP_NAME = 'AuraNews';
export const ADMIN_APP_NAME = 'Aura Admin';
/** @deprecated Use PUBLIC_APP_NAME or ADMIN_APP_NAME */
export const APP_NAME = PUBLIC_APP_NAME;

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
  ArticleIdeaListResponse,
  ArticleIdeaOutlineSection,
  ArticleIdeaStatus,
  ArticleIdeaSummary,
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
  ArticleDetail,
  ArticleListResponse,
  ArticleSeo,
  ArticleSummary,
  CategoryDetail,
  CategoryListResponse,
  CategorySummary,
  PaginatedMeta,
} from './api.types';
