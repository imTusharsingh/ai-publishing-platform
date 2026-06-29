import type { TopicListResponse, TopicStatus, TopicSummary } from '@repo/shared';
import { authFetch } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';

function getAccessToken() {
  const token = useAuthStore.getState().accessToken;
  if (!token) {
    throw new Error('Not authenticated');
  }
  return token;
}

export interface ListTopicsParams {
  status?: TopicStatus;
  limit?: number;
  page?: number;
}

export interface UpdateTopicRequest {
  title?: string;
  description?: string;
  matchedCategoryId?: string | null;
}

export function listTopics(params: ListTopicsParams = {}): Promise<TopicListResponse> {
  const search = new URLSearchParams();
  search.set('limit', String(params.limit ?? 50));
  if (params.page) {
    search.set('page', String(params.page));
  }
  if (params.status) {
    search.set('status', params.status);
  }

  return authFetch<TopicListResponse>(`/v1/topics?${search.toString()}`, getAccessToken());
}

export function updateTopicStatus(id: string, status: TopicStatus): Promise<TopicSummary> {
  return authFetch<TopicSummary>(`/v1/topics/${id}/status`, getAccessToken(), {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export function updateTopic(id: string, data: UpdateTopicRequest): Promise<TopicSummary> {
  return authFetch<TopicSummary>(`/v1/topics/${id}`, getAccessToken(), {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function triggerTopicDiscovery(): Promise<{ jobId: string; state: string }> {
  return authFetch<{ jobId: string; state: string }>('/v1/topics/discover', getAccessToken(), {
    method: 'POST',
  });
}
