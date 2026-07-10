import type { JobStatusEntry } from '@repo/shared';
import { authFetch } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';

function getAccessToken() {
  const token = useAuthStore.getState().accessToken;
  if (!token) {
    throw new Error('Not authenticated');
  }
  return token;
}

export function listJobs(limit = 20): Promise<JobStatusEntry[]> {
  return authFetch<JobStatusEntry[]>(`/v1/jobs?limit=${limit}`, getAccessToken());
}

export function enqueuePingJob(message: string): Promise<JobStatusEntry> {
  return authFetch<JobStatusEntry>('/v1/jobs/ping', getAccessToken(), {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
}

export function retryJob(id: string): Promise<JobStatusEntry> {
  return authFetch<JobStatusEntry>(`/v1/jobs/${id}/retry`, getAccessToken(), {
    method: 'POST',
  });
}

export function getJob(id: string): Promise<JobStatusEntry> {
  return authFetch<JobStatusEntry>(`/v1/jobs/${id}`, getAccessToken());
}
