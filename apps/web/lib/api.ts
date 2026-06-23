import type { ArticleListResponse, CategoryListResponse } from '@repo/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3008';

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${path}`);
  }

  return response.json() as Promise<T>;
}

export function getArticles(params?: {
  page?: number;
  limit?: number;
  category?: string;
}): Promise<ArticleListResponse> {
  const search = new URLSearchParams();
  if (params?.page) search.set('page', String(params.page));
  if (params?.limit) search.set('limit', String(params.limit));
  if (params?.category) search.set('category', params.category);

  const query = search.toString();
  return fetchJson<ArticleListResponse>(`/v1/articles${query ? `?${query}` : ''}`);
}

export function getCategories(): Promise<CategoryListResponse> {
  return fetchJson<CategoryListResponse>('/v1/categories?activeOnly=true');
}
