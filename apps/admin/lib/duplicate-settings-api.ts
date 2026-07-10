import { authFetch } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';

export interface DuplicateThresholdSettings {
  titleThreshold: number;
  summaryThreshold: number;
  contentThreshold: number;
  topicCooldownDays: number;
  clusterDistanceThreshold: number;
}

function getAccessToken(): string {
  const token = useAuthStore.getState().accessToken;
  if (!token) {
    throw new Error('Not authenticated');
  }
  return token;
}

export function getDuplicateSettings(): Promise<DuplicateThresholdSettings> {
  return authFetch<DuplicateThresholdSettings>('/v1/admin/settings/duplicate', getAccessToken());
}

export function updateDuplicateSettings(
  settings: DuplicateThresholdSettings,
): Promise<DuplicateThresholdSettings> {
  return authFetch<DuplicateThresholdSettings>('/v1/admin/settings/duplicate', getAccessToken(), {
    method: 'PUT',
    body: JSON.stringify(settings),
  });
}
