import { ArticleIdeaStatus } from '@prisma/client';

export interface ArticleIdeaOutlineSection {
  heading: string;
  points: string[];
}

export interface ArticleIdeaResponse {
  id: string;
  categoryId: string;
  categoryName: string | null;
  trendingTopicId: string | null;
  trendingTopicTitle: string | null;
  title: string;
  slugCandidate: string;
  summary: string | null;
  outline: ArticleIdeaOutlineSection[] | null;
  intent: string | null;
  status: ArticleIdeaStatus;
  createdAt: Date;
}

export interface ArticleIdeaListResponse {
  data: ArticleIdeaResponse[];
  meta: { total: number; page: number; limit: number };
}
