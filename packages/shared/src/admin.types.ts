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
