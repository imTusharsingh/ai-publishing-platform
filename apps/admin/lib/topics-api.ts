import type { TopicListResponse } from '@repo/shared';
import { authFetch } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';

function getAccessToken() {
  const token = useAuthStore.getState().accessToken;
  if (!token) {
    throw new Error('Not authenticated');
  }
  return token;
}

export function listTopics(): Promise<TopicListResponse> {
  return authFetch<TopicListResponse>('/v1/topics', getAccessToken());
}

export function triggerTopicDiscovery(): Promise<{ jobId: string; state: string }> {
  return authFetch<{ jobId: string; state: string }>('/v1/topics/discover', getAccessToken(), {
    method: 'POST',
  });
}
