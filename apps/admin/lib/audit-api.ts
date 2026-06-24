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

export function listAuditLogs(page = 1, limit = 20): Promise<AuditLogListResponse> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  return authFetch<AuditLogListResponse>(`/v1/audit-logs?${params}`, getAccessToken());
}
