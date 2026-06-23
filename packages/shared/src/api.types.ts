export interface CategorySummary {
  id: string;
  name: string;
  slug: string;
}

export interface CategoryDetail {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  keywords: string[];
  priorityScore: number;
  isActive: boolean;
  articleCount?: number;
}

export interface ArticleSummary {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  publishedAt: string;
  authorName: string;
  featuredImageUrl: string | null;
  category: CategorySummary;
}

export interface ArticleSeo {
  title: string | null;
  description: string | null;
  canonicalUrl: string | null;
  ogImageUrl: string | null;
  structuredData: Record<string, unknown> | null;
}

export interface ArticleDetail {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  content: string | null;
  authorName: string;
  featuredImageUrl: string | null;
  publishedAt: string;
  viewCount: string;
  category: CategorySummary;
  seo: ArticleSeo;
}

export interface PaginatedMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ArticleListResponse {
  data: ArticleSummary[];
  meta: PaginatedMeta;
}

export interface CategoryListResponse {
  data: Array<{
    id: string;
    name: string;
    slug: string;
    description: string | null;
    priorityScore: number;
    isActive: boolean;
  }>;
  meta: { total: number };
}
