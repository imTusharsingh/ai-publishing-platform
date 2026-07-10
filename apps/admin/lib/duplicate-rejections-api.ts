import { authFetch } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';

export interface DuplicateRejectionEntry {
  id: string;
  rejectedTitle: string;
  rejectedAt: string;
  layer: number;
  matchedArticleId: string | null;
  matchedArticleTitle: string | null;
  similarityScore: number | null;
  reason: string | null;
  metadata: Record<string, unknown> | null;
}

export interface DuplicateRejectionListResponse {
  data: DuplicateRejectionEntry[];
  meta: { total: number; page: number; limit: number };
}

function getAccessToken(): string {
  const token = useAuthStore.getState().accessToken;
  if (!token) {
    throw new Error('Not authenticated');
  }
  return token;
}

export function listDuplicateRejections(params?: {
  page?: number;
  limit?: number;
  layer?: number;
}): Promise<DuplicateRejectionListResponse> {
  const search = new URLSearchParams();
  if (params?.page) search.set('page', String(params.page));
  if (params?.limit) search.set('limit', String(params.limit));
  if (params?.layer) search.set('layer', String(params.layer));

  const query = search.toString();
  const path = query ? `/v1/admin/duplicate-rejections?${query}` : '/v1/admin/duplicate-rejections';
  return authFetch<DuplicateRejectionListResponse>(path, getAccessToken());
}
