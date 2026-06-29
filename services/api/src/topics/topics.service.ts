import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, TopicStatus } from '@prisma/client';
import { normalizeTopicTitle } from '@repo/shared';
import { discoverTrends as runTrendDiscovery } from '@repo/database';
import { JOB_NAMES, getDefaultQueue, type TrendDiscoveryJobData } from '@repo/queue';
import { PrismaService } from '../prisma/prisma.service';
import { ListTopicsQueryDto } from './dto/list-topics-query.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';
import { DiscoverTopicsResult, TopicListResponse, TopicResponse } from './topics.types';

@Injectable()
export class TopicsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ListTopicsQueryDto): Promise<TopicListResponse> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const where = query.status ? { status: query.status } : undefined;

    const [topics, total] = await Promise.all([
      this.prisma.trendingTopic.findMany({
        where,
        include: { matchedCategory: { select: { name: true } } },
        orderBy: [{ discoveredAt: 'desc' }, { popularityScore: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.trendingTopic.count({ where }),
    ]);

    return {
      data: topics.map((topic) => this.toResponse(topic)),
      meta: { total, page, limit },
    };
  }

  async findById(id: string): Promise<TopicResponse> {
    const topic = await this.prisma.trendingTopic.findUnique({
      where: { id },
      include: { matchedCategory: { select: { name: true } } },
    });

    if (!topic) {
      throw new NotFoundException(`Topic with id "${id}" not found`);
    }

    return this.toResponse(topic);
  }

  async updateStatus(id: string, status: TopicStatus, reviewerId?: string): Promise<TopicResponse> {
    const existing = await this.prisma.trendingTopic.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Topic with id "${id}" not found`);
    }

    const data: Prisma.TrendingTopicUpdateInput = { status };
    if (
      reviewerId &&
      (status === TopicStatus.APPROVED ||
        status === TopicStatus.REJECTED ||
        status === TopicStatus.SUGGESTED)
    ) {
      data.reviewedBy = { connect: { id: reviewerId } };
      data.reviewedAt = new Date();
    }

    const topic = await this.prisma.trendingTopic.update({
      where: { id },
      data,
      include: { matchedCategory: { select: { name: true } } },
    });

    return this.toResponse(topic);
  }

  async update(id: string, dto: UpdateTopicDto): Promise<TopicResponse> {
    const existing = await this.prisma.trendingTopic.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Topic with id "${id}" not found`);
    }

    if (dto.matchedCategoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: dto.matchedCategoryId },
      });
      if (!category) {
        throw new NotFoundException(`Category with id "${dto.matchedCategoryId}" not found`);
      }
    }

    const title = dto.title?.trim();
    const topic = await this.prisma.trendingTopic.update({
      where: { id },
      data: {
        ...(title ? { title, normalizedTitle: normalizeTopicTitle(title) } : {}),
        ...(dto.description !== undefined ? { description: dto.description.trim() || null } : {}),
        ...(dto.matchedCategoryId !== undefined
          ? dto.matchedCategoryId
            ? { matchedCategory: { connect: { id: dto.matchedCategoryId } } }
            : { matchedCategory: { disconnect: true } }
          : {}),
      },
      include: { matchedCategory: { select: { name: true } } },
    });

    return this.toResponse(topic);
  }

  async enqueueDiscovery(): Promise<DiscoverTopicsResult> {
    const queue = getDefaultQueue();
    const runId = `${Date.now()}`;
    const job = await queue.add(JOB_NAMES.TREND_DISCOVERY, {
      runId,
    } satisfies TrendDiscoveryJobData);

    const state = await job.getState();

    return {
      jobId: job.id ?? '',
      state,
    };
  }

  async runDiscovery(runId: string) {
    return runTrendDiscovery(this.prisma, runId);
  }

  private toResponse(topic: {
    id: string;
    source: TopicResponse['source'];
    title: string;
    normalizedTitle: string;
    description: string | null;
    popularityScore: { toNumber?: () => number } | number;
    sourceUrl: string | null;
    sourceMetadata: Prisma.JsonValue;
    matchedCategoryId: string | null;
    status: TopicResponse['status'];
    discoveredAt: Date;
    matchedCategory: { name: string } | null;
  }): TopicResponse {
    const metadata =
      topic.sourceMetadata && typeof topic.sourceMetadata === 'object'
        ? (topic.sourceMetadata as Record<string, unknown>)
        : null;

    return {
      id: topic.id,
      source: topic.source,
      title: topic.title,
      normalizedTitle: topic.normalizedTitle,
      description: topic.description,
      popularityScore:
        typeof topic.popularityScore === 'number'
          ? topic.popularityScore
          : (topic.popularityScore.toNumber?.() ?? Number(topic.popularityScore)),
      sourceUrl: topic.sourceUrl,
      discoveryProvider: typeof metadata?.provider === 'string' ? metadata.provider : null,
      matchedCategoryId: topic.matchedCategoryId,
      matchedCategoryName: topic.matchedCategory?.name ?? null,
      status: topic.status,
      discoveredAt: topic.discoveredAt,
    };
  }
}
