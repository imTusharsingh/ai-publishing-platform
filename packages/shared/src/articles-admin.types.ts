export type ArticleAdminStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface ArticleAdminSummary {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  status: ArticleAdminStatus;
  articleIdeaId: string;
  categoryId: string;
  categoryName: string;
  publishedAt: string | null;
  createdAt: string;
}

export interface ArticleAdminDetail extends ArticleAdminSummary {
  content: string | null;
  contentPlain: string | null;
  authorName: string;
  seoTitle: string | null;
  seoDescription: string | null;
}

export interface ArticleAdminListResponse {
  data: ArticleAdminSummary[];
  meta: { total: number; page: number; limit: number };
}

export interface UpdateArticleStatusRequest {
  status: ArticleAdminStatus;
}

export interface GenerateArticleResponse {
  jobId: string;
  ideaId: string;
  state: string;
}
