import type {
  ArticleAdminDetail,
  ArticleAdminListResponse,
  GenerateArticleResponse,
  UpdateArticleStatusRequest,
} from '@repo/shared';
import { authFetch } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';

function getAccessToken() {
  const token = useAuthStore.getState().accessToken;
  if (!token) {
    throw new Error('Not authenticated');
  }
  return token;
}

export function listAdminArticles(params?: {
  page?: number;
  limit?: number;
  status?: string;
}): Promise<ArticleAdminListResponse> {
  const search = new URLSearchParams();
  if (params?.page) search.set('page', String(params.page));
  if (params?.limit) search.set('limit', String(params.limit));
  if (params?.status) search.set('status', params.status);

  const query = search.toString();
  const path = query ? `/v1/admin/articles?${query}` : '/v1/admin/articles';
  return authFetch<ArticleAdminListResponse>(path, getAccessToken());
}

export function getAdminArticle(id: string): Promise<ArticleAdminDetail> {
  return authFetch<ArticleAdminDetail>(`/v1/admin/articles/${id}`, getAccessToken());
}

export function updateArticleStatus(
  id: string,
  payload: UpdateArticleStatusRequest,
): Promise<ArticleAdminDetail> {
  return authFetch<ArticleAdminDetail>(`/v1/admin/articles/${id}/status`, getAccessToken(), {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function generateArticleFromIdea(ideaId: string): Promise<GenerateArticleResponse> {
  return authFetch<GenerateArticleResponse>(
    `/v1/article-ideas/${ideaId}/generate`,
    getAccessToken(),
    { method: 'POST' },
  );
}
