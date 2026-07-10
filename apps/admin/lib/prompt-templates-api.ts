import type {
  PromptCatalogResponse,
  PromptTemplateKey,
  SavePromptTemplateRequest,
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

export function getPromptCatalog(categoryId?: string | null): Promise<PromptCatalogResponse> {
  const query = categoryId ? `?categoryId=${encodeURIComponent(categoryId)}` : '';
  return authFetch<PromptCatalogResponse>(
    `/v1/admin/prompt-templates/catalog${query}`,
    getAccessToken(),
  );
}

export function savePromptByKey(
  key: PromptTemplateKey,
  input: SavePromptTemplateRequest,
): Promise<unknown> {
  return authFetch(
    `/v1/admin/prompt-templates/by-key/${encodeURIComponent(key)}`,
    getAccessToken(),
    {
      method: 'PUT',
      body: JSON.stringify(input),
    },
  );
}

export function resetPromptByKey(
  key: PromptTemplateKey,
  categoryId?: string | null,
): Promise<unknown> {
  return authFetch(
    `/v1/admin/prompt-templates/by-key/${encodeURIComponent(key)}/reset`,
    getAccessToken(),
    {
      method: 'POST',
      body: JSON.stringify({ categoryId: categoryId ?? null }),
    },
  );
}

export function initializePromptTemplates(): Promise<PromptCatalogResponse> {
  return authFetch<PromptCatalogResponse>(
    '/v1/admin/prompt-templates/initialize',
    getAccessToken(),
    {
      method: 'POST',
    },
  );
}
