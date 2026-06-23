export const APP_NAME = 'AI Publishing Platform';

export function formatApiVersion(version: string): string {
  return `v${version}`;
}

export type {
  ArticleListResponse,
  ArticleSummary,
  CategoryListResponse,
  CategorySummary,
  PaginatedMeta,
} from './api.types';
