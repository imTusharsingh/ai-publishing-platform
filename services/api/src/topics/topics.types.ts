import { TopicStatus, TrendSource } from '@prisma/client';

export interface TopicResponse {
  id: string;
  source: TrendSource;
  title: string;
  normalizedTitle: string;
  description: string | null;
  popularityScore: number;
  sourceUrl: string | null;
  matchedCategoryId: string | null;
  matchedCategoryName: string | null;
  status: TopicStatus;
  discoveredAt: Date;
}

export interface TopicListResponse {
  data: TopicResponse[];
  meta: { total: number; page: number; limit: number };
}

export interface DiscoverTopicsResult {
  jobId: string;
  state: string;
}
