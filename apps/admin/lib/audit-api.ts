import type { AuditLogListResponse } from '@repo/shared';
import { authFetch } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';

function getAccessToken() {
  const token = useAuthStore.getState().accessToken;
  if (!token) {
    throw new Error('Not authenticated');
  }
  return token;
}

export function listAuditLogs(params?: {
  page?: number;
  limit?: number;
  entityType?: string;
}): Promise<AuditLogListResponse> {
  const search = new URLSearchParams();
  search.set('page', String(params?.page ?? 1));
  search.set('limit', String(params?.limit ?? 20));
  if (params?.entityType) {
    search.set('entityType', params.entityType);
  }

  return authFetch<AuditLogListResponse>(`/v1/audit-logs?${search}`, getAccessToken());
}
