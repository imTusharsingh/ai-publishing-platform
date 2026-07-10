'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import type { TopicStatus } from '@repo/shared';
import {
  AdminInsightCard,
  AdminMetricCard,
  AdminPageBody,
  AdminPageHeader,
  AdminPageShell,
  AdminScrollCard,
  AdminStatusBadge,
} from '@/components/admin-ui';
import { getDashboardMetrics } from '@/lib/dashboard-api';
import { formatDate, formatRelativeTime } from '@/lib/format';
import { cn } from '@/lib/cn';

export function DashboardPage() {
  const metricsQuery = useQuery({
    queryKey: ['admin-dashboard-metrics'],
    queryFn: () => getDashboardMetrics(),
    refetchInterval: 30000,
  });

  const metrics = metricsQuery.data;
  const pipeline = metrics?.pipeline;
  const categoryPerformance = metrics?.categoryPerformance ?? [];
  const recentTopics = metrics?.recentTopics ?? [];
  const recentArticles = metrics?.recentArticles ?? [];
  const maxCategoryCount = Math.max(...categoryPerformance.map((row) => row.publishedCount), 1);

  const attentionItems = [
    pipeline && pipeline.topicsPending > 0
      ? {
          label: `${pipeline.topicsPending} topic${pipeline.topicsPending === 1 ? '' : 's'} awaiting review`,
          href: '/topics',
          action: 'Review topics',
        }
      : null,
    pipeline && pipeline.ideasApproved > 0
      ? {
          label: `${pipeline.ideasApproved} approved idea${pipeline.ideasApproved === 1 ? '' : 's'} ready to generate`,
          href: '/ideas?status=APPROVED',
          action: 'Generate articles',
        }
      : null,
    pipeline && pipeline.ideasFailed > 0
      ? {
          label: `${pipeline.ideasFailed} failed idea generation${pipeline.ideasFailed === 1 ? '' : 's'}`,
          href: '/ideas?status=FAILED',
          action: 'View ideas',
        }
      : null,
    metrics && metrics.aiJobs.failed > 0
      ? {
          label: `${metrics.aiJobs.failed} failed AI job${metrics.aiJobs.failed === 1 ? '' : 's'}`,
          href: '/jobs?status=failed',
          action: 'View jobs',
        }
      : null,
    metrics && metrics.publishingJobs.failed > 0
      ? {
          label: `${metrics.publishingJobs.failed} failed publishing job${metrics.publishingJobs.failed === 1 ? '' : 's'}`,
          href: '/jobs?status=failed',
          action: 'View jobs',
        }
      : null,
  ].filter(Boolean) as Array<{ label: string; href: string; action: string }>;

  return (
    <AdminPageShell fillHeight={false}>
      <AdminPageHeader
        breadcrumb="Dashboard"
        title="Dashboard Overview"
        description="Editorial pipeline health, publishing velocity, and items that need your attention."
        className="mb-stack-md shrink-0"
      />

      <div className="mb-stack-md grid grid-cols-1 gap-gutter sm:grid-cols-2 xl:grid-cols-4">
        <AdminInsightCard
          label="Published Today"
          value={String(metrics?.articlesPublishedToday ?? '—')}
          icon="today"
          meta="Last 24 hours"
          accent="primary"
        />
        <AdminInsightCard
          label="Published This Week"
          value={String(metrics?.articlesPublishedThisWeek ?? '—')}
          icon="date_range"
          meta="Rolling 7 days"
          accent="secondary"
        />
        <AdminInsightCard
          label="Published This Month"
          value={String(metrics?.articlesPublishedThisMonth ?? '—')}
          icon="calendar_month"
          meta="Rolling 30 days"
          accent="tertiary"
        />
        <AdminInsightCard
          label="Total Published"
          value={String(pipeline?.articlesPublishedTotal ?? '—')}
          icon="article"
          meta={`${pipeline?.categoriesActive ?? 0} active categories`}
          accent="primary"
        />
      </div>

      <AdminPageBody className="gap-gutter pb-stack-lg">
        <section>
          <h2 className="mb-3 font-display text-headline-sm text-on-surface">Editorial pipeline</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <PipelineStep
              label="Pending topics"
              value={pipeline?.topicsPending}
              href="/topics"
              loading={metricsQuery.isLoading}
            />
            <PipelineStep
              label="Approved topics"
              value={pipeline?.topicsApproved}
              href="/topics"
              loading={metricsQuery.isLoading}
            />
            <PipelineStep
              label="Draft ideas"
              value={pipeline?.ideasDraft}
              href="/ideas?status=DRAFT"
              loading={metricsQuery.isLoading}
            />
            <PipelineStep
              label="Ready to write"
              value={pipeline?.ideasApproved}
              href="/ideas?status=APPROVED"
              highlight={(pipeline?.ideasApproved ?? 0) > 0}
              loading={metricsQuery.isLoading}
            />
            <PipelineStep
              label="Draft articles"
              value={pipeline?.articlesDraft}
              href="/articles?status=DRAFT"
              loading={metricsQuery.isLoading}
            />
            <PipelineStep
              label="Generating"
              value={pipeline?.ideasGenerating}
              href="/ideas?status=GENERATING"
              highlight={(pipeline?.ideasGenerating ?? 0) > 0}
              loading={metricsQuery.isLoading}
            />
          </div>
        </section>

        <div className="grid gap-gutter lg:grid-cols-12">
          <div className="flex flex-col gap-gutter lg:col-span-8">
            <AdminScrollCard
              className="max-h-80"
              header={
                <div className="border-b border-outline-variant bg-surface-container-low p-stack-md">
                  <h3 className="font-display text-headline-sm text-on-surface">
                    Category performance
                  </h3>
                  <p className="mt-1 text-body-sm text-on-surface-variant">
                    Published articles by category
                  </p>
                </div>
              }
            >
              {metricsQuery.isLoading && (
                <p className="p-stack-md text-body-sm text-on-surface-variant">Loading metrics…</p>
              )}
              {metricsQuery.isError && (
                <p className="p-stack-md text-body-sm text-on-error-container">
                  Failed to load dashboard metrics.
                </p>
              )}
              {metrics && categoryPerformance.length === 0 && (
                <p className="p-stack-md text-body-sm text-on-surface-variant">
                  No published articles yet. Approve topics, generate ideas, and publish articles to
                  see category breakdown here.
                </p>
              )}
              {categoryPerformance.length > 0 && (
                <ul className="divide-y divide-outline-variant">
                  {categoryPerformance.map((row) => (
                    <li key={row.categoryId} className="flex items-center gap-4 px-stack-md py-4">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-on-surface">{row.categoryName}</p>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-container-high">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{
                              width: `${Math.max(8, (row.publishedCount / maxCategoryCount) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                      <span className="shrink-0 font-display text-headline-sm text-primary">
                        {row.publishedCount}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </AdminScrollCard>

            <div className="grid gap-gutter md:grid-cols-2">
              <AdminMetricCard
                label="AI success rate"
                value={metrics ? `${metrics.aiJobs.successRate}%` : '—'}
                hint={
                  metrics
                    ? `${metrics.aiJobs.completed} completed · ${metrics.aiJobs.failed} failed · ${metrics.aiJobs.running} running`
                    : undefined
                }
              />
              <AdminMetricCard
                label="Publishing jobs"
                value={metrics ? String(metrics.publishingJobs.published) : '—'}
                hint={
                  metrics
                    ? `${metrics.publishingJobs.queued} queued · ${metrics.publishingJobs.processing} processing · ${metrics.publishingJobs.failed} failed`
                    : undefined
                }
              />
            </div>

            {metrics && Object.keys(metrics.duplicateRejectionsByLayer).length > 0 && (
              <div className="admin-card p-stack-md">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-display text-headline-sm text-on-surface">
                      Duplicate rejections
                    </h3>
                    <p className="mt-1 text-body-sm text-on-surface-variant">
                      Content blocked by the duplicate detection engine
                    </p>
                  </div>
                  <Link
                    href="/duplicate-settings"
                    className="text-label-sm text-primary hover:underline"
                  >
                    View log
                  </Link>
                </div>
                <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                  {Object.entries(metrics.duplicateRejectionsByLayer).map(([layer, count]) => (
                    <li
                      key={layer}
                      className="flex items-center justify-between rounded-lg bg-surface-container-low px-3 py-2 text-body-sm"
                    >
                      <span className="text-on-surface-variant">Layer {layer}</span>
                      <span className="font-medium text-on-surface">{count}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-gutter lg:col-span-4">
            <div className="admin-card p-stack-md">
              <h3 className="font-display text-headline-sm text-on-surface">Needs attention</h3>
              {metricsQuery.isLoading && (
                <p className="mt-3 text-body-sm text-on-surface-variant">Loading…</p>
              )}
              {!metricsQuery.isLoading && attentionItems.length === 0 && (
                <p className="mt-3 text-body-sm text-secondary">
                  Pipeline is clear — no urgent items right now.
                </p>
              )}
              <ul className="mt-3 space-y-3">
                {attentionItems.map((item) => (
                  <li
                    key={item.label}
                    className="rounded-lg border border-outline-variant bg-surface-container-low p-3"
                  >
                    <p className="text-body-sm text-on-surface">{item.label}</p>
                    <Link
                      href={item.href}
                      className="mt-2 inline-block text-label-sm text-primary hover:underline"
                    >
                      {item.action} →
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="admin-card space-y-2 p-stack-md">
              <h3 className="font-display text-headline-sm text-on-surface">Quick actions</h3>
              <Link href="/topics" className="admin-btn-accent w-full">
                Sync & review topics
              </Link>
              <Link href="/ideas" className="admin-btn-primary w-full">
                Idea pipeline
              </Link>
              <Link href="/articles" className="admin-btn-secondary w-full">
                Manage articles
              </Link>
              <Link href="/categories" className="admin-btn-secondary w-full">
                Categories
              </Link>
            </div>
          </div>
        </div>

        <div className="grid gap-gutter lg:grid-cols-2">
          <AdminScrollCard
            className="min-w-0"
            header={
              <div className="flex items-center justify-between border-b border-outline-variant bg-surface-container-low p-stack-md">
                <div>
                  <h3 className="font-display text-headline-sm text-on-surface">Recent topics</h3>
                  <p className="mt-1 text-body-sm text-on-surface-variant">
                    Latest discovered trends
                  </p>
                </div>
                <Link href="/topics" className="text-label-sm text-primary hover:underline">
                  View all
                </Link>
              </div>
            }
          >
            {metrics && recentTopics.length === 0 && (
              <p className="p-stack-md text-body-sm text-on-surface-variant">
                No topics yet. Run trend discovery from the Topics page.
              </p>
            )}
            {recentTopics.length > 0 && (
              <ul className="divide-y divide-outline-variant">
                {recentTopics.map((topic) => (
                  <li key={topic.id} className="flex items-start justify-between gap-3 p-stack-md">
                    <div className="min-w-0">
                      <p className="line-clamp-2 text-body-sm text-on-surface">{topic.title}</p>
                      <p className="mt-1 text-label-sm text-on-surface-variant">
                        {formatRelativeTime(topic.discoveredAt)} · score{' '}
                        {Math.round(topic.popularityScore)}
                      </p>
                    </div>
                    <AdminStatusBadge status={topic.status as TopicStatus} />
                  </li>
                ))}
              </ul>
            )}
          </AdminScrollCard>

          <AdminScrollCard
            className="min-w-0"
            header={
              <div className="flex items-center justify-between border-b border-outline-variant bg-surface-container-low p-stack-md">
                <div>
                  <h3 className="font-display text-headline-sm text-on-surface">
                    Recently published
                  </h3>
                  <p className="mt-1 text-body-sm text-on-surface-variant">Latest live articles</p>
                </div>
                <Link href="/articles" className="text-label-sm text-primary hover:underline">
                  View all
                </Link>
              </div>
            }
          >
            {metrics && recentArticles.length === 0 && (
              <p className="p-stack-md text-body-sm text-on-surface-variant">
                No published articles yet. Generate and publish content to see it here.
              </p>
            )}
            {recentArticles.length > 0 && (
              <ul className="divide-y divide-outline-variant">
                {recentArticles.map((article) => (
                  <li key={article.id} className="p-stack-md">
                    <p className="line-clamp-2 text-body-sm font-medium text-on-surface">
                      {article.title}
                    </p>
                    <p className="mt-1 text-label-sm text-on-surface-variant">
                      {article.categoryName} · {formatDate(article.publishedAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </AdminScrollCard>
        </div>
      </AdminPageBody>
    </AdminPageShell>
  );
}

function PipelineStep({
  label,
  value,
  href,
  highlight = false,
  loading = false,
}: {
  label: string;
  value?: number;
  href: string;
  highlight?: boolean;
  loading?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'admin-card block p-4 transition-shadow hover:shadow-panel',
        highlight && 'ring-2 ring-secondary/40',
      )}
    >
      <p className="text-label-sm text-on-surface-variant">{label}</p>
      <p className="mt-2 font-display text-headline-md text-on-surface">
        {loading ? '—' : (value ?? 0)}
      </p>
    </Link>
  );
}
