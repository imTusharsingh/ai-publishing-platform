import { Injectable, NotFoundException } from '@nestjs/common';
import { ArticleStatus, Prisma } from '@prisma/client';
import { searchArticles as searchArticlesDb } from '@repo/database';
import { PrismaService } from '../prisma/prisma.service';
import { ListArticlesQueryDto } from './dto/list-articles-query.dto';
import { SearchArticlesQueryDto } from './dto/search-articles-query.dto';

export interface ArticleSummaryResponse {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  publishedAt: string;
  authorName: string;
  featuredImageUrl: string | null;
  category: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface ArticleDetailResponse {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  content: string | null;
  authorName: string;
  featuredImageUrl: string | null;
  publishedAt: string;
  viewCount: string;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  seo: {
    title: string | null;
    description: string | null;
    canonicalUrl: string | null;
    ogImageUrl: string | null;
    structuredData: Record<string, unknown> | null;
  };
  relatedArticles?: ArticleSummaryResponse[];
}

export interface ArticleListResponse {
  data: ArticleSummaryResponse[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

@Injectable()
export class ArticlesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ListArticlesQueryDto): Promise<ArticleListResponse> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 12;
    const skip = (page - 1) * limit;

    const where: Prisma.ArticleWhereInput = {
      status: ArticleStatus.PUBLISHED,
      publishedAt: { not: null },
    };

    if (query.category) {
      const category = await this.prisma.category.findUnique({
        where: { slug: query.category },
        select: { id: true },
      });

      if (!category) {
        throw new NotFoundException(`Category with slug "${query.category}" not found`);
      }

      where.categoryId = category.id;
    }

    const orderBy =
      query.sort === 'publishedAt'
        ? { publishedAt: 'desc' as const }
        : { publishedAt: 'desc' as const };

    const [articles, total] = await Promise.all([
      this.prisma.article.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          category: {
            select: { id: true, name: true, slug: true },
          },
        },
      }),
      this.prisma.article.count({ where }),
    ]);

    return {
      data: articles.map((article) => this.toSummary(article)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async search(query: SearchArticlesQueryDto) {
    return searchArticlesDb(this.prisma, {
      query: query.q,
      page: query.page,
      limit: query.limit,
      categorySlug: query.category,
    });
  }

  async findBySlug(slug: string): Promise<ArticleDetailResponse> {
    const article = await this.prisma.article.findFirst({
      where: {
        slug,
        status: ArticleStatus.PUBLISHED,
        publishedAt: { not: null },
      },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        relatedFrom: {
          take: 6,
          orderBy: { similarityScore: 'desc' },
          include: {
            relatedArticle: {
              include: {
                category: { select: { id: true, name: true, slug: true } },
              },
            },
          },
        },
      },
    });

    if (!article) {
      throw new NotFoundException(`Article with slug "${slug}" not found`);
    }

    const detail = this.toDetail(article);
    const relatedArticles = article.relatedFrom
      .filter((row) => row.relatedArticle.status === ArticleStatus.PUBLISHED)
      .map((row) => this.toSummary(row.relatedArticle));

    return { ...detail, relatedArticles };
  }

  private toDetail(article: {
    id: string;
    title: string;
    slug: string;
    summary: string | null;
    content: string | null;
    publishedAt: Date | null;
    authorName: string;
    featuredImageUrl: string | null;
    viewCount: bigint;
    seoTitle: string | null;
    seoDescription: string | null;
    canonicalUrl: string | null;
    ogImageUrl: string | null;
    structuredData: unknown;
    category: { id: string; name: string; slug: string };
  }): ArticleDetailResponse {
    return {
      id: article.id,
      title: article.title,
      slug: article.slug,
      summary: article.summary,
      content: article.content,
      publishedAt: article.publishedAt?.toISOString() ?? new Date().toISOString(),
      authorName: article.authorName,
      featuredImageUrl: article.featuredImageUrl,
      viewCount: article.viewCount.toString(),
      category: article.category,
      seo: {
        title: article.seoTitle,
        description: article.seoDescription,
        canonicalUrl: article.canonicalUrl,
        ogImageUrl: article.ogImageUrl,
        structuredData: (article.structuredData as Record<string, unknown> | null) ?? null,
      },
    };
  }

  private toSummary(article: {
    id: string;
    title: string;
    slug: string;
    summary: string | null;
    publishedAt: Date | null;
    authorName: string;
    featuredImageUrl: string | null;
    category: { id: string; name: string; slug: string };
  }): ArticleSummaryResponse {
    return {
      id: article.id,
      title: article.title,
      slug: article.slug,
      summary: article.summary,
      publishedAt: article.publishedAt?.toISOString() ?? new Date().toISOString(),
      authorName: article.authorName,
      featuredImageUrl: article.featuredImageUrl,
      category: article.category,
    };
  }
}
