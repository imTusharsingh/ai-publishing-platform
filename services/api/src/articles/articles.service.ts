import { Injectable, NotFoundException } from '@nestjs/common';
import { ArticleStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ListArticlesQueryDto } from './dto/list-articles-query.dto';

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
