export const APP_NAME = 'AI Publishing Platform';

export function formatApiVersion(version: string): string {
  return `v${version}`;
}

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
