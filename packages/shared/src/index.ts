export const APP_NAME = 'AI Publishing Platform';

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
