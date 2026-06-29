import { Injectable, NotFoundException } from '@nestjs/common';
import { TopicStatus } from '@prisma/client';
import { discoverTrends as runTrendDiscovery } from '@repo/database';
import { JOB_NAMES, getDefaultQueue, type TrendDiscoveryJobData } from '@repo/queue';
import { PrismaService } from '../prisma/prisma.service';
import { ListTopicsQueryDto } from './dto/list-topics-query.dto';
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
        orderBy: [{ popularityScore: 'desc' }, { discoveredAt: 'desc' }],
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

  async updateStatus(id: string, status: TopicStatus): Promise<TopicResponse> {
    const topic = await this.prisma.trendingTopic.update({
      where: { id },
      data: { status },
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
    matchedCategoryId: string | null;
    status: TopicResponse['status'];
    discoveredAt: Date;
    matchedCategory: { name: string } | null;
  }): TopicResponse {
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
      matchedCategoryId: topic.matchedCategoryId,
      matchedCategoryName: topic.matchedCategory?.name ?? null,
      status: topic.status,
      discoveredAt: topic.discoveredAt,
    };
  }
}
