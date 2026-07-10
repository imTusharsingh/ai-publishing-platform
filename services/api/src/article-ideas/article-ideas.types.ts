import { ArticleIdeaStatus } from '@prisma/client';
import type {
  ArticleIdeaContentPlan,
  ArticleIdeaOutlineSection,
  ArticleImageSuggestion,
} from '@repo/shared';

export type { ArticleIdeaContentPlan, ArticleIdeaOutlineSection, ArticleImageSuggestion };

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
  contentPlan: ArticleIdeaContentPlan | null;
  intent: string | null;
  status: ArticleIdeaStatus;
  createdAt: Date;
  articleId: string | null;
  hasArticle: boolean;
}

export interface EnqueueArticleGenerationResult {
  jobId: string;
  ideaId: string;
  state: string;
}

export interface ArticleIdeaListResponse {
  data: ArticleIdeaResponse[];
  meta: { total: number; page: number; limit: number };
}
