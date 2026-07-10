export type ArticleIdeaStatus =
  | 'DRAFT'
  | 'DUPLICATE_REJECTED'
  | 'APPROVED'
  | 'GENERATING'
  | 'FAILED';

export interface ArticleIdeaOutlineSection {
  heading: string;
  points: string[];
}

export interface ArticleImageSuggestion {
  position: string;
  type: string;
  title: string;
  description: string;
  alt: string;
}

export interface ArticleIdeaContentPlan {
  summary: string;
  outline: ArticleIdeaOutlineSection[];
  imageSuggestions: ArticleImageSuggestion[];
  narrativeNotes?: string;
}

export interface ArticleIdeaSummary {
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
  createdAt: string;
  articleId: string | null;
  hasArticle: boolean;
}

export interface ArticleIdeaListResponse {
  data: ArticleIdeaSummary[];
  meta: { total: number; page: number; limit: number };
}

export interface CreateArticleIdeaRequest {
  categoryId: string;
  title: string;
  summary?: string;
  trendingTopicId?: string;
  intent?: string;
}

export interface UpdateArticleIdeaStatusRequest {
  status: ArticleIdeaStatus;
}

export type { GenerateArticleResponse } from './articles-admin.types';
