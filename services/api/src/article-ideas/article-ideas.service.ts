import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ArticleIdeaStatus, Prisma } from '@prisma/client';
import { JOB_NAMES, getDefaultQueue, type ArticleWritingJobData } from '@repo/queue';
import { PrismaService } from '../prisma/prisma.service';
import { generateUniqueSlug, slugify } from '../categories/slug.util';
import { CreateArticleIdeaDto } from './dto/create-article-idea.dto';
import { ListArticleIdeasQueryDto } from './dto/list-article-ideas-query.dto';
import {
  ArticleIdeaListResponse,
  ArticleIdeaOutlineSection,
  ArticleIdeaResponse,
  GenerateArticleResult,
} from './article-ideas.types';
import { generateArticleIdeaFromTopic } from '@repo/database';

function isDuplicateIdeaError(message: string): boolean {
  return (
    message.includes('Duplicate') ||
    message.includes('matches existing') ||
    message.includes('already exists')
  );
}

@Injectable()
export class ArticleIdeasService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ListArticleIdeasQueryDto): Promise<ArticleIdeaListResponse> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.ArticleIdeaWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.categoryId) where.categoryId = query.categoryId;

    const [ideas, total] = await Promise.all([
      this.prisma.articleIdea.findMany({
        where,
        include: {
          category: { select: { name: true } },
          trendingTopic: { select: { title: true } },
          article: { select: { id: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.articleIdea.count({ where }),
    ]);

    return {
      data: ideas.map((idea) => this.toResponse(idea)),
      meta: { total, page, limit },
    };
  }

  async findById(id: string): Promise<ArticleIdeaResponse> {
    const idea = await this.prisma.articleIdea.findUnique({
      where: { id },
      include: {
        category: { select: { name: true } },
        trendingTopic: { select: { title: true } },
        article: { select: { id: true } },
      },
    });

    if (!idea) {
      throw new NotFoundException(`Article idea with id "${id}" not found`);
    }

    return this.toResponse(idea);
  }

  async create(dto: CreateArticleIdeaDto): Promise<ArticleIdeaResponse> {
    await this.ensureCategoryExists(dto.categoryId);

    if (dto.trendingTopicId) {
      await this.ensureTopicExists(dto.trendingTopicId);
    }

    const slugCandidate = await this.generateSlugCandidate(dto.title);

    const idea = await this.prisma.articleIdea.create({
      data: {
        categoryId: dto.categoryId,
        trendingTopicId: dto.trendingTopicId,
        title: dto.title,
        slugCandidate,
        summary: dto.summary,
        intent: dto.intent,
        status: ArticleIdeaStatus.DRAFT,
      },
      include: {
        category: { select: { name: true } },
        trendingTopic: { select: { title: true } },
      },
    });

    return this.toResponse(idea);
  }

  async createFromTopic(topicId: string): Promise<ArticleIdeaResponse> {
    try {
      const result = await generateArticleIdeaFromTopic(this.prisma, topicId);
      return this.findById(result.ideaId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Idea generation failed';

      if (message.includes('not found')) {
        throw new NotFoundException(message);
      }

      if (message.includes('no matched category')) {
        throw new BadRequestException(message);
      }

      if (isDuplicateIdeaError(message)) {
        throw new ConflictException(message);
      }

      throw error;
    }
  }

  async updateStatus(id: string, status: ArticleIdeaStatus): Promise<ArticleIdeaResponse> {
    const existing = await this.prisma.articleIdea.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Article idea with id "${id}" not found`);
    }

    if (
      status === ArticleIdeaStatus.APPROVED &&
      existing.status === ArticleIdeaStatus.DUPLICATE_REJECTED
    ) {
      throw new ConflictException('Cannot approve a duplicate-rejected idea');
    }

    const idea = await this.prisma.articleIdea.update({
      where: { id },
      data: { status },
      include: {
        category: { select: { name: true } },
        trendingTopic: { select: { title: true } },
        article: { select: { id: true } },
      },
    });

    return this.toResponse(idea);
  }

  async enqueueGenerate(id: string): Promise<GenerateArticleResult> {
    const idea = await this.prisma.articleIdea.findUnique({
      where: { id },
      include: { article: { select: { id: true } } },
    });

    if (!idea) {
      throw new NotFoundException(`Article idea with id "${id}" not found`);
    }

    if (idea.article) {
      throw new ConflictException('Article already exists for this idea');
    }

    if (idea.status !== ArticleIdeaStatus.APPROVED && idea.status !== ArticleIdeaStatus.FAILED) {
      throw new BadRequestException(
        `Only approved or failed ideas can be generated (current: ${idea.status})`,
      );
    }

    await this.prisma.articleIdea.update({
      where: { id },
      data: { status: ArticleIdeaStatus.GENERATING },
    });

    const queue = getDefaultQueue();
    const job = await queue.add(JOB_NAMES.ARTICLE_WRITING, {
      ideaId: id,
    } satisfies ArticleWritingJobData);

    const state = await job.getState();

    return {
      jobId: job.id ?? '',
      ideaId: id,
      state,
    };
  }

  private async ensureCategoryExists(categoryId: string): Promise<void> {
    const category = await this.prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) {
      throw new NotFoundException(`Category with id "${categoryId}" not found`);
    }
  }

  private async ensureTopicExists(topicId: string): Promise<void> {
    const topic = await this.prisma.trendingTopic.findUnique({ where: { id: topicId } });
    if (!topic) {
      throw new NotFoundException(`Topic with id "${topicId}" not found`);
    }
  }

  private async generateSlugCandidate(title: string): Promise<string> {
    const base = slugify(title) || 'article-idea';

    return generateUniqueSlug(base, async (candidate) => {
      const existing = await this.prisma.articleIdea.findUnique({
        where: { slugCandidate: candidate },
      });
      return existing !== null;
    });
  }

  private toResponse(idea: {
    id: string;
    categoryId: string;
    trendingTopicId: string | null;
    title: string;
    slugCandidate: string;
    summary: string | null;
    outline: Prisma.JsonValue;
    contentPlan?: Prisma.JsonValue | null;
    intent: string | null;
    status: ArticleIdeaResponse['status'];
    createdAt: Date;
    category: { name: string };
    trendingTopic: { title: string } | null;
    article?: { id: string } | null;
  }): ArticleIdeaResponse {
    return {
      id: idea.id,
      categoryId: idea.categoryId,
      categoryName: idea.category?.name ?? null,
      trendingTopicId: idea.trendingTopicId,
      trendingTopicTitle: idea.trendingTopic?.title ?? null,
      title: idea.title,
      slugCandidate: idea.slugCandidate,
      summary: idea.summary,
      outline: this.parseOutline(idea.outline),
      contentPlan: this.parseContentPlan(idea.contentPlan),
      intent: idea.intent,
      status: idea.status,
      createdAt: idea.createdAt,
      articleId: idea.article?.id ?? null,
      hasArticle: Boolean(idea.article),
    };
  }

  private parseOutline(value: Prisma.JsonValue): ArticleIdeaOutlineSection[] | null {
    if (!Array.isArray(value)) {
      return null;
    }

    return value as unknown as ArticleIdeaOutlineSection[];
  }

  private parseContentPlan(
    value: Prisma.JsonValue | null | undefined,
  ): ArticleIdeaResponse['contentPlan'] {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return null;
    }

    const record = value as Record<string, unknown>;
    const summary = typeof record.summary === 'string' ? record.summary : null;
    const outline = this.parseOutline(record.outline as Prisma.JsonValue);
    if (!summary || !outline) {
      return null;
    }

    const imageSuggestions = Array.isArray(record.imageSuggestions)
      ? record.imageSuggestions
          .map((entry) => {
            if (!entry || typeof entry !== 'object') {
              return null;
            }
            const item = entry as Record<string, unknown>;
            const title = typeof item.title === 'string' ? item.title : '';
            const description = typeof item.description === 'string' ? item.description : '';
            if (!title || !description) {
              return null;
            }
            return {
              position: typeof item.position === 'string' ? item.position : 'in article body',
              type: typeof item.type === 'string' ? item.type : 'illustration',
              title,
              description,
              alt: typeof item.alt === 'string' ? item.alt : title,
            };
          })
          .filter((item): item is NonNullable<typeof item> => item !== null)
      : [];

    return {
      summary,
      outline,
      imageSuggestions,
      narrativeNotes: typeof record.narrativeNotes === 'string' ? record.narrativeNotes : undefined,
    };
  }
}
