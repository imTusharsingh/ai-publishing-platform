import type { AdminDashboardMetrics } from '@repo/shared';
import { authFetch } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';

function getAccessToken() {
  const token = useAuthStore.getState().accessToken;
  if (!token) {
    throw new Error('Not authenticated');
  }
  return token;
}

export function getDashboardMetrics(): Promise<AdminDashboardMetrics> {
  return authFetch<AdminDashboardMetrics>('/v1/admin/dashboard', getAccessToken());
}
