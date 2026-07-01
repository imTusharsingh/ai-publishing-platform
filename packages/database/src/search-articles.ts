import { ArticleStatus, PrismaClient } from '@prisma/client';

export interface SearchArticlesInput {
  query: string;
  page?: number;
  limit?: number;
  categorySlug?: string;
}

export interface SearchArticleHit {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  publishedAt: string;
  rank: number;
  category: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface SearchArticlesResult {
  data: SearchArticleHit[];
  meta: {
    query: string;
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface SearchRow {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  published_at: Date;
  rank: number;
  category_id: string;
  category_name: string;
  category_slug: string;
}

export async function searchArticles(
  prisma: PrismaClient,
  input: SearchArticlesInput,
): Promise<SearchArticlesResult> {
  const query = input.query.trim();
  const page = input.page ?? 1;
  const limit = Math.min(input.limit ?? 12, 50);
  const offset = (page - 1) * limit;

  if (!query) {
    return {
      data: [],
      meta: { query, page, limit, total: 0, totalPages: 1 },
    };
  }

  const tsQuery = query
    .split(/\s+/)
    .filter(Boolean)
    .map((term) => `${term}:*`)
    .join(' & ');

  const categoryClause = input.categorySlug ? 'AND c.slug = $4' : '';
  const searchParams: unknown[] = input.categorySlug
    ? [tsQuery, ArticleStatus.PUBLISHED, limit, input.categorySlug, offset]
    : [tsQuery, ArticleStatus.PUBLISHED, limit, offset];

  const offsetParam = input.categorySlug ? '$5' : '$4';

  const rows = (await prisma.$queryRawUnsafe(
    `
    SELECT
      a.id,
      a.title,
      a.slug,
      a.summary,
      a.published_at,
      ts_rank(a.search_vector, to_tsquery('english', $1)) AS rank,
      c.id AS category_id,
      c.name AS category_name,
      c.slug AS category_slug
    FROM articles a
    INNER JOIN categories c ON c.id = a.category_id
    WHERE a.status = $2::"ArticleStatus"
      AND a.published_at IS NOT NULL
      AND a.search_vector @@ to_tsquery('english', $1)
      ${categoryClause}
    ORDER BY rank DESC, a.published_at DESC
    LIMIT $3
    OFFSET ${offsetParam}
    `,
    ...searchParams,
  )) as SearchRow[];

  const countCategoryClause = input.categorySlug ? 'AND c.slug = $3' : '';
  const countParams: unknown[] = input.categorySlug
    ? [tsQuery, ArticleStatus.PUBLISHED, input.categorySlug]
    : [tsQuery, ArticleStatus.PUBLISHED];

  const countRows = (await prisma.$queryRawUnsafe(
    `
    SELECT COUNT(*)::int AS total
    FROM articles a
    INNER JOIN categories c ON c.id = a.category_id
    WHERE a.status = $2::"ArticleStatus"
      AND a.published_at IS NOT NULL
      AND a.search_vector @@ to_tsquery('english', $1)
      ${countCategoryClause}
    `,
    ...countParams,
  )) as Array<{ total: number }>;

  const total = countRows[0]?.total ?? 0;

  return {
    data: rows.map((row) => ({
      id: row.id,
      title: row.title,
      slug: row.slug,
      summary: row.summary,
      publishedAt: row.published_at.toISOString(),
      rank: Number(row.rank),
      category: {
        id: row.category_id,
        name: row.category_name,
        slug: row.category_slug,
      },
    })),
    meta: {
      query,
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}
