import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ArticleStatus, Prisma } from '@prisma/client';
import { checkPrePublishDuplicates, registerCanonicalTopic } from '@repo/database';
import { PrismaService } from '../prisma/prisma.service';
import { ListAdminArticlesQueryDto } from './dto/list-admin-articles-query.dto';

export interface ArticleAdminSummaryResponse {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  status: ArticleStatus;
  articleIdeaId: string;
  categoryId: string;
  categoryName: string;
  publishedAt: string | null;
  createdAt: string;
}

export interface ArticleAdminDetailResponse extends ArticleAdminSummaryResponse {
  content: string | null;
  contentPlain: string | null;
  authorName: string;
  seoTitle: string | null;
  seoDescription: string | null;
}

export interface ArticleAdminListResponse {
  data: ArticleAdminSummaryResponse[];
  meta: { total: number; page: number; limit: number };
}

@Injectable()
export class ArticlesAdminService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ListAdminArticlesQueryDto): Promise<ArticleAdminListResponse> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.ArticleWhereInput = {};
    if (query.status) {
      where.status = query.status;
    }

    const [articles, total] = await Promise.all([
      this.prisma.article.findMany({
        where,
        include: { category: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.article.count({ where }),
    ]);

    return {
      data: articles.map((article) => this.toSummary(article)),
      meta: { total, page, limit },
    };
  }

  async findById(id: string): Promise<ArticleAdminDetailResponse> {
    const article = await this.prisma.article.findUnique({
      where: { id },
      include: { category: { select: { id: true, name: true } } },
    });

    if (!article) {
      throw new NotFoundException(`Article with id "${id}" not found`);
    }

    return this.toDetail(article);
  }

  async updateStatus(id: string, status: ArticleStatus): Promise<ArticleAdminDetailResponse> {
    const existing = await this.prisma.article.findUnique({
      where: { id },
      include: {
        articleIdea: { select: { intent: true } },
      },
    });
    if (!existing) {
      throw new NotFoundException(`Article with id "${id}" not found`);
    }

    if (status === ArticleStatus.PUBLISHED && !existing.content?.trim()) {
      throw new BadRequestException('Cannot publish an article without content');
    }

    if (status === ArticleStatus.PUBLISHED && existing.status !== ArticleStatus.PUBLISHED) {
      const duplicateCheck = await checkPrePublishDuplicates(this.prisma, {
        articleId: existing.id,
        title: existing.title,
        slug: existing.slug,
        summary: existing.summary,
        contentPlain: existing.contentPlain,
        intent: existing.articleIdea.intent,
      });

      if (!duplicateCheck.passed) {
        throw new BadRequestException(
          duplicateCheck.reason ?? 'Article rejected by duplicate detection',
        );
      }
    }

    const article = await this.prisma.article.update({
      where: { id },
      data: {
        status,
        publishedAt:
          status === ArticleStatus.PUBLISHED
            ? (existing.publishedAt ?? new Date())
            : status === ArticleStatus.DRAFT
              ? null
              : existing.publishedAt,
      },
      include: { category: { select: { id: true, name: true } } },
    });

    if (status === ArticleStatus.PUBLISHED && existing.status !== ArticleStatus.PUBLISHED) {
      await registerCanonicalTopic(this.prisma, {
        articleId: article.id,
        title: article.title,
        intent: existing.articleIdea.intent,
        summary: article.summary,
      });
    }

    return this.toDetail(article);
  }

  private toSummary(article: {
    id: string;
    title: string;
    slug: string;
    summary: string | null;
    status: ArticleStatus;
    articleIdeaId: string;
    categoryId: string;
    publishedAt: Date | null;
    createdAt: Date;
    category: { id: string; name: string };
  }): ArticleAdminSummaryResponse {
    return {
      id: article.id,
      title: article.title,
      slug: article.slug,
      summary: article.summary,
      status: article.status,
      articleIdeaId: article.articleIdeaId,
      categoryId: article.categoryId,
      categoryName: article.category.name,
      publishedAt: article.publishedAt?.toISOString() ?? null,
      createdAt: article.createdAt.toISOString(),
    };
  }

  private toDetail(article: {
    id: string;
    title: string;
    slug: string;
    summary: string | null;
    content: string | null;
    contentPlain: string | null;
    authorName: string;
    status: ArticleStatus;
    articleIdeaId: string;
    categoryId: string;
    publishedAt: Date | null;
    createdAt: Date;
    seoTitle: string | null;
    seoDescription: string | null;
    category: { id: string; name: string };
  }): ArticleAdminDetailResponse {
    return {
      ...this.toSummary(article),
      content: article.content,
      contentPlain: article.contentPlain,
      authorName: article.authorName,
      seoTitle: article.seoTitle,
      seoDescription: article.seoDescription,
    };
  }
}
