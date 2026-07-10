import { PrismaClient } from '@prisma/client';

export interface AdminDashboardMetrics {
  articlesPublishedToday: number;
  articlesPublishedThisWeek: number;
  articlesPublishedThisMonth: number;
  categoryPerformance: Array<{
    categoryId: string;
    categoryName: string;
    publishedCount: number;
  }>;
  duplicateRejectionsByLayer: Record<string, number>;
  aiJobs: {
    total: number;
    completed: number;
    failed: number;
    running: number;
    successRate: number;
  };
  publishingJobs: {
    queued: number;
    processing: number;
    published: number;
    failed: number;
  };
  pipeline: {
    topicsPending: number;
    topicsApproved: number;
    ideasDraft: number;
    ideasApproved: number;
    ideasGenerating: number;
    ideasFailed: number;
    articlesDraft: number;
    articlesPublishedTotal: number;
    categoriesActive: number;
    categoriesTotal: number;
  };
  recentTopics: Array<{
    id: string;
    title: string;
    status: string;
    discoveredAt: string;
    popularityScore: number;
  }>;
  recentArticles: Array<{
    id: string;
    title: string;
    slug: string;
    publishedAt: string;
    categoryName: string;
  }>;
}

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function daysAgo(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() - days);
  return copy;
}

export async function getAdminDashboardMetrics(
  prisma: PrismaClient,
): Promise<AdminDashboardMetrics> {
  const now = new Date();
  const todayStart = startOfDay(now);
  const weekStart = daysAgo(now, 7);
  const monthStart = daysAgo(now, 30);

  const [
    articlesPublishedToday,
    articlesPublishedThisWeek,
    articlesPublishedThisMonth,
    categoryPerformance,
    duplicateRejections,
    aiJobCounts,
    publishingJobCounts,
    topicsPending,
    topicsApproved,
    ideasDraft,
    ideasApproved,
    ideasGenerating,
    ideasFailed,
    articlesDraft,
    articlesPublishedTotal,
    categoriesActive,
    categoriesTotal,
    recentTopics,
    recentArticles,
  ] = await Promise.all([
    prisma.article.count({
      where: { status: 'PUBLISHED', publishedAt: { gte: todayStart } },
    }),
    prisma.article.count({
      where: { status: 'PUBLISHED', publishedAt: { gte: weekStart } },
    }),
    prisma.article.count({
      where: { status: 'PUBLISHED', publishedAt: { gte: monthStart } },
    }),
    prisma.article.groupBy({
      by: ['categoryId'],
      where: { status: 'PUBLISHED' },
      _count: { id: true },
    }),
    prisma.duplicateRejection.groupBy({
      by: ['layer'],
      _count: { id: true },
    }),
    prisma.aiJob.groupBy({
      by: ['status'],
      _count: { id: true },
    }),
    prisma.publishingJob.groupBy({
      by: ['status'],
      _count: { id: true },
    }),
    prisma.trendingTopic.count({
      where: { status: { in: ['DISCOVERED', 'SUGGESTED'] } },
    }),
    prisma.trendingTopic.count({ where: { status: 'APPROVED' } }),
    prisma.articleIdea.count({ where: { status: 'DRAFT' } }),
    prisma.articleIdea.count({ where: { status: 'APPROVED' } }),
    prisma.articleIdea.count({ where: { status: 'GENERATING' } }),
    prisma.articleIdea.count({ where: { status: 'FAILED' } }),
    prisma.article.count({ where: { status: 'DRAFT' } }),
    prisma.article.count({ where: { status: 'PUBLISHED' } }),
    prisma.category.count({ where: { isActive: true } }),
    prisma.category.count(),
    prisma.trendingTopic.findMany({
      orderBy: { discoveredAt: 'desc' },
      take: 6,
      select: {
        id: true,
        title: true,
        status: true,
        discoveredAt: true,
        popularityScore: true,
      },
    }),
    prisma.article.findMany({
      where: { status: 'PUBLISHED', publishedAt: { not: null } },
      orderBy: { publishedAt: 'desc' },
      take: 6,
      select: {
        id: true,
        title: true,
        slug: true,
        publishedAt: true,
        category: { select: { name: true } },
      },
    }),
  ]);

  const categories = await prisma.category.findMany({
    select: { id: true, name: true },
  });
  const categoryNameById = new Map(categories.map((category) => [category.id, category.name]));

  const aiTotal = aiJobCounts.reduce((sum, row) => sum + row._count.id, 0);
  const aiCompleted = aiJobCounts.find((row) => row.status === 'COMPLETED')?._count.id ?? 0;
  const aiFailed = aiJobCounts.find((row) => row.status === 'FAILED')?._count.id ?? 0;
  const aiRunning = aiJobCounts.find((row) => row.status === 'RUNNING')?._count.id ?? 0;

  const publishingByStatus = Object.fromEntries(
    publishingJobCounts.map((row) => [row.status, row._count.id]),
  ) as Record<string, number>;

  return {
    articlesPublishedToday,
    articlesPublishedThisWeek,
    articlesPublishedThisMonth,
    categoryPerformance: categoryPerformance
      .map((row) => ({
        categoryId: row.categoryId,
        categoryName: categoryNameById.get(row.categoryId) ?? 'Unknown',
        publishedCount: row._count.id,
      }))
      .sort((a, b) => b.publishedCount - a.publishedCount),
    duplicateRejectionsByLayer: Object.fromEntries(
      duplicateRejections.map((row) => [String(row.layer), row._count.id]),
    ),
    aiJobs: {
      total: aiTotal,
      completed: aiCompleted,
      failed: aiFailed,
      running: aiRunning,
      successRate: aiTotal > 0 ? Math.round((aiCompleted / aiTotal) * 100) : 0,
    },
    publishingJobs: {
      queued: publishingByStatus.QUEUED ?? 0,
      processing: publishingByStatus.PROCESSING ?? 0,
      published: publishingByStatus.PUBLISHED ?? 0,
      failed: publishingByStatus.FAILED ?? 0,
    },
    pipeline: {
      topicsPending,
      topicsApproved,
      ideasDraft,
      ideasApproved,
      ideasGenerating,
      ideasFailed,
      articlesDraft,
      articlesPublishedTotal,
      categoriesActive,
      categoriesTotal,
    },
    recentTopics: recentTopics.map((topic) => ({
      id: topic.id,
      title: topic.title,
      status: topic.status,
      discoveredAt: topic.discoveredAt.toISOString(),
      popularityScore: Number(topic.popularityScore),
    })),
    recentArticles: recentArticles
      .filter((article) => article.publishedAt)
      .map((article) => ({
        id: article.id,
        title: article.title,
        slug: article.slug,
        publishedAt: article.publishedAt!.toISOString(),
        categoryName: article.category.name,
      })),
  };
}
