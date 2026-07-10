import { ArticleIdeaStatus } from '@prisma/client';

export interface ArticleIdeaOutlineSection {
  heading: string;
  points: string[];
}

export interface ArticleIdeaImageSuggestion {
  position: string;
  type: string;
  title: string;
  description: string;
  alt: string;
}

export interface ArticleIdeaContentPlan {
  summary: string;
  outline: ArticleIdeaOutlineSection[];
  imageSuggestions: ArticleIdeaImageSuggestion[];
  narrativeNotes?: string;
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
  contentPlan: ArticleIdeaContentPlan | null;
  intent: string | null;
  status: ArticleIdeaStatus;
  createdAt: Date;
  articleId: string | null;
  hasArticle: boolean;
}

export interface GenerateArticleResult {
  jobId: string;
  ideaId: string;
  state: string;
}

export interface ArticleIdeaListResponse {
  data: ArticleIdeaResponse[];
  meta: { total: number; page: number; limit: number };
}
