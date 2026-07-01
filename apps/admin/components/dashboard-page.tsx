'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import type { TopicStatus } from '@repo/shared';
import {
  AdminMetricCard,
  AdminPageBody,
  AdminPageHeader,
  AdminPageShell,
  AdminScrollCard,
  AdminStatusBadge,
} from '@/components/admin-ui';
import { getDashboardMetrics } from '@/lib/dashboard-api';
import { listTopics } from '@/lib/topics-api';

export function DashboardPage() {
  const metricsQuery = useQuery({
    queryKey: ['admin-dashboard-metrics'],
    queryFn: () => getDashboardMetrics(),
    refetchInterval: 30000,
  });

  const topicsQuery = useQuery({
    queryKey: ['admin-topics-dashboard'],
    queryFn: () => listTopics({ limit: 5, status: 'DISCOVERED' }),
    refetchInterval: 15000,
  });

  const metrics = metricsQuery.data;
  const topics = topicsQuery.data?.data ?? [];

  return (
    <AdminPageShell>
      <AdminPageHeader
        breadcrumb="Dashboard"
        title="Dashboard Overview"
        description="Publishing velocity, AI health, and duplicate detection stats."
        className="mb-stack-md shrink-0"
      />

      <div className="mb-stack-md grid shrink-0 grid-cols-1 gap-gutter md:grid-cols-2 lg:grid-cols-4">
        <AdminMetricCard
          label="Published Today"
          value={String(metrics?.articlesPublishedToday ?? '—')}
        />
        <AdminMetricCard
          label="Published This Week"
          value={String(metrics?.articlesPublishedThisWeek ?? '—')}
        />
        <AdminMetricCard
          label="AI Success Rate"
          value={metrics ? `${metrics.aiJobs.successRate}%` : '—'}
        />
        <AdminMetricCard
          label="Publishing Jobs Failed"
          value={String(metrics?.publishingJobs.failed ?? '—')}
        />
      </div>

      <AdminPageBody className="min-h-0 gap-gutter lg:grid lg:grid-cols-12">
        <AdminScrollCard
          className="lg:col-span-8"
          header={
            <div className="flex items-center justify-between border-b border-outline-variant bg-surface-container-low p-stack-md">
              <h3 className="font-display text-headline-sm text-on-surface">
                Category Performance
              </h3>
            </div>
          }
        >
          {metricsQuery.isLoading && (
            <p className="p-stack-md text-body-sm text-on-surface-variant">Loading metrics…</p>
          )}
          {metrics && metrics.categoryPerformance.length > 0 && (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th className="text-right">Published</th>
                </tr>
              </thead>
              <tbody>
                {metrics.categoryPerformance.map((row) => (
                  <tr key={row.categoryId}>
                    <td>{row.categoryName}</td>
                    <td className="text-right">{row.publishedCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {metrics && Object.keys(metrics.duplicateRejectionsByLayer).length > 0 && (
            <div className="border-t border-outline-variant p-stack-md">
              <h4 className="mb-2 text-label-md text-on-surface">Duplicate rejections by layer</h4>
              <ul className="text-body-sm text-on-surface-variant">
                {Object.entries(metrics.duplicateRejectionsByLayer).map(([layer, count]) => (
                  <li key={layer}>
                    Layer {layer}: {count}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </AdminScrollCard>

        <div className="admin-card shrink-0 space-y-4 p-stack-md lg:col-span-4 lg:self-start">
          <h3 className="font-display text-headline-sm text-on-surface">Recent Topics</h3>
          {topics.map((topic) => (
            <div key={topic.id} className="flex items-center justify-between text-body-sm">
              <span className="line-clamp-1">{topic.title}</span>
              <AdminStatusBadge status={topic.status as TopicStatus} />
            </div>
          ))}
          <Link href="/topics" className="admin-btn-accent w-full">
            Review Topics
          </Link>
          <Link href="/jobs" className="admin-btn-secondary w-full">
            AI Jobs
          </Link>
        </div>
      </AdminPageBody>
    </AdminPageShell>
  );
}
