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
  intent: string | null;
  status: ArticleIdeaStatus;
  createdAt: string;
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
