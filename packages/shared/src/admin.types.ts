export type PublishFrequency = 'DAILY' | 'TWICE_DAILY' | 'WEEKLY';

export interface CategoryAdmin {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  keywords: string[];
  priorityScore: number;
  publishFrequency: PublishFrequency;
  articlesPerCycle: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  articleCount?: number;
}

export interface CategoryAdminListResponse {
  data: CategoryAdmin[];
  meta: { total: number };
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
  keywords?: string[];
  priorityScore?: number;
  publishFrequency?: PublishFrequency;
  articlesPerCycle?: number;
  isActive?: boolean;
}

export type UpdateCategoryRequest = Partial<CreateCategoryRequest>;

export interface AuditLogEntry {
  id: string;
  userId: string | null;
  userEmail: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  payload: Record<string, unknown> | null;
  createdAt: string;
}

export interface AuditLogListResponse {
  data: AuditLogEntry[];
  meta: { total: number; page: number; limit: number };
}
