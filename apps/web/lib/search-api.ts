import type { ArticleSearchResponse } from '@repo/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3008';

export function searchArticles(params: {
  q: string;
  page?: number;
  limit?: number;
  category?: string;
}): Promise<ArticleSearchResponse> {
  const search = new URLSearchParams();
  search.set('q', params.q);
  if (params.page) search.set('page', String(params.page));
  if (params.limit) search.set('limit', String(params.limit));
  if (params.category) search.set('category', params.category);

  return fetch(`${API_URL}/v1/articles/search?${search.toString()}`, {
    next: { revalidate: 60 },
  }).then((response) => {
    if (!response.ok) {
      throw new Error(`Search failed: ${response.status}`);
    }
    return response.json() as Promise<ArticleSearchResponse>;
  });
}
