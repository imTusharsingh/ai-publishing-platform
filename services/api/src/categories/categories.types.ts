import { PublishFrequency } from '@prisma/client';

export interface CategoryResponse {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  keywords: string[];
  priorityScore: number;
  publishFrequency: PublishFrequency;
  articlesPerCycle: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  articleCount?: number;
}

export interface CategoryListResponse {
  data: CategoryResponse[];
  meta: { total: number };
}
