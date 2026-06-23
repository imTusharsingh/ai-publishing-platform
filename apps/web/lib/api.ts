import type {
  ArticleDetail,
  ArticleListResponse,
  CategoryDetail,
  CategoryListResponse,
} from '@repo/shared';

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

async function fetchJsonOptional<T>(path: string): Promise<T | null> {
  const response = await fetch(`${API_URL}${path}`, {
    next: { revalidate: 60 },
  });

  if (response.status === 404) {
    return null;
  }

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

export function getArticle(slug: string): Promise<ArticleDetail | null> {
  return fetchJsonOptional<ArticleDetail>(`/v1/articles/${slug}`);
}

export function getCategory(slug: string): Promise<CategoryDetail | null> {
  return fetchJsonOptional<CategoryDetail>(`/v1/categories/${slug}`);
}
