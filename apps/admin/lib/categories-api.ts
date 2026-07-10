import type {
  CategoryAdmin,
  CategoryAdminListResponse,
  CategoryRemoveResult,
  CreateCategoryRequest,
  UpdateCategoryRequest,
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

export function listCategories(): Promise<CategoryAdminListResponse> {
  return authFetch<CategoryAdminListResponse>('/v1/categories', getAccessToken());
}

export function createCategory(payload: CreateCategoryRequest): Promise<CategoryAdmin> {
  return authFetch<CategoryAdmin>('/v1/categories', getAccessToken(), {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateCategory(id: string, payload: UpdateCategoryRequest): Promise<CategoryAdmin> {
  return authFetch<CategoryAdmin>(`/v1/categories/${id}`, getAccessToken(), {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function deleteCategory(id: string): Promise<CategoryRemoveResult> {
  return authFetch<CategoryRemoveResult>(`/v1/categories/${id}`, getAccessToken(), {
    method: 'DELETE',
  });
}
