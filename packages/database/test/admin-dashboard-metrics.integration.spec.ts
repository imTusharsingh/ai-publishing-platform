import { prisma, getAdminDashboardMetrics, seed } from '../src';

describe('getAdminDashboardMetrics', () => {
  beforeAll(async () => {
    await seed();
  });

  it('returns aggregated dashboard metrics', async () => {
    const metrics = await getAdminDashboardMetrics(prisma);

    expect(metrics).toMatchObject({
      articlesPublishedToday: expect.any(Number),
      articlesPublishedThisWeek: expect.any(Number),
      articlesPublishedThisMonth: expect.any(Number),
      pipeline: {
        topicsPending: expect.any(Number),
        topicsApproved: expect.any(Number),
        ideasDraft: expect.any(Number),
        ideasApproved: expect.any(Number),
        ideasGenerating: expect.any(Number),
        ideasFailed: expect.any(Number),
        articlesDraft: expect.any(Number),
        articlesPublishedTotal: expect.any(Number),
        categoriesActive: expect.any(Number),
        categoriesTotal: expect.any(Number),
      },
      aiJobs: {
        total: expect.any(Number),
        completed: expect.any(Number),
        failed: expect.any(Number),
        running: expect.any(Number),
        successRate: expect.any(Number),
      },
      publishingJobs: {
        queued: expect.any(Number),
        processing: expect.any(Number),
        published: expect.any(Number),
        failed: expect.any(Number),
      },
    });
    expect(Array.isArray(metrics.categoryPerformance)).toBe(true);
    expect(Array.isArray(metrics.recentTopics)).toBe(true);
    expect(Array.isArray(metrics.recentArticles)).toBe(true);
  });
});
