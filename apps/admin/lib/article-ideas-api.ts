import type {
  ArticleIdeaListResponse,
  ArticleIdeaSummary,
  CreateArticleIdeaRequest,
  UpdateArticleIdeaStatusRequest,
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

export function listArticleIdeas(params?: {
  page?: number;
  limit?: number;
  status?: string;
  categoryId?: string;
}): Promise<ArticleIdeaListResponse> {
  const search = new URLSearchParams();
  if (params?.page) search.set('page', String(params.page));
  if (params?.limit) search.set('limit', String(params.limit));
  if (params?.status) search.set('status', params.status);
  if (params?.categoryId) search.set('categoryId', params.categoryId);

  const query = search.toString();
  const path = query ? `/v1/article-ideas?${query}` : '/v1/article-ideas';
  return authFetch<ArticleIdeaListResponse>(path, getAccessToken());
}

export function createArticleIdea(payload: CreateArticleIdeaRequest): Promise<ArticleIdeaSummary> {
  return authFetch<ArticleIdeaSummary>('/v1/article-ideas', getAccessToken(), {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function createArticleIdeaFromTopic(topicId: string): Promise<ArticleIdeaSummary> {
  return authFetch<ArticleIdeaSummary>(
    `/v1/article-ideas/from-topic/${topicId}`,
    getAccessToken(),
    {
      method: 'POST',
    },
  );
}

export function updateArticleIdeaStatus(
  id: string,
  payload: UpdateArticleIdeaStatusRequest,
): Promise<ArticleIdeaSummary> {
  return authFetch<ArticleIdeaSummary>(`/v1/article-ideas/${id}/status`, getAccessToken(), {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}
