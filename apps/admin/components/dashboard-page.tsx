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
import { listAdminArticles } from '@/lib/articles-api';
import { listJobs } from '@/lib/jobs-api';
import { listTopics } from '@/lib/topics-api';

export function DashboardPage() {
  const topicsQuery = useQuery({
    queryKey: ['admin-topics-dashboard'],
    queryFn: () => listTopics({ limit: 5, status: 'DISCOVERED' }),
    refetchInterval: 15000,
  });

  const articlesQuery = useQuery({
    queryKey: ['admin-articles-dashboard'],
    queryFn: () => listAdminArticles({ limit: 1, status: 'PUBLISHED' }),
  });

  const jobsQuery = useQuery({
    queryKey: ['admin-jobs-dashboard'],
    queryFn: () => listJobs(),
    refetchInterval: 10000,
  });

  const publishedTotal = articlesQuery.data?.meta.total ?? '—';
  const activeJobs =
    jobsQuery.data?.filter((job) => job.state === 'active' || job.state === 'waiting').length ?? 0;
  const topics = topicsQuery.data?.data ?? [];
  const successRate =
    jobsQuery.data && jobsQuery.data.length > 0
      ? `${Math.round(
          (jobsQuery.data.filter((j) => j.state === 'completed').length / jobsQuery.data.length) *
            100,
        )}%`
      : '—';

  return (
    <AdminPageShell>
      <AdminPageHeader
        breadcrumb="Dashboard"
        title="Dashboard Overview"
        description="System status and content velocity monitor."
        className="mb-stack-md shrink-0"
      />

      <div className="mb-stack-md grid shrink-0 grid-cols-1 gap-gutter md:grid-cols-2 lg:grid-cols-4">
        <AdminMetricCard
          label="Articles Published"
          value={String(publishedTotal)}
          hint={
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">trending_up</span> Live
            </span>
          }
        />
        <AdminMetricCard
          label="AI Success Rate"
          value={successRate}
          hint={
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">check_circle</span> Stable
            </span>
          }
        />
        <AdminMetricCard
          label="Discovered Topics"
          value={String(topicsQuery.data?.meta.total ?? '—')}
          hint={
            <span className="flex items-center gap-1 text-tertiary">
              <span className="material-symbols-outlined text-[14px]">shield</span> Active
            </span>
          }
        />
        <AdminMetricCard label="Active AI Jobs" value={String(activeJobs)} />
      </div>

      <AdminPageBody className="min-h-0 gap-gutter lg:grid lg:grid-cols-12">
        <AdminScrollCard
          className="lg:col-span-8"
          header={
            <div className="flex items-center justify-between border-b border-outline-variant bg-surface-container-low p-stack-md">
              <h3 className="font-display text-headline-sm text-on-surface">
                Recent Trending Topics
              </h3>
              <Link href="/topics" className="text-label-md text-primary hover:underline">
                View all
              </Link>
            </div>
          }
        >
          {topicsQuery.isLoading && (
            <p className="p-stack-md text-body-sm text-on-surface-variant">Loading topics…</p>
          )}
          {topicsQuery.isError && (
            <p className="p-stack-md text-body-sm text-on-error-container">
              Failed to load topics. Is the API running?
            </p>
          )}
          {topics.length > 0 && (
            <table className="admin-table admin-table-sticky">
              <thead>
                <tr>
                  <th>Topic / Keyword</th>
                  <th>Source</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {topics.map((topic) => (
                  <tr key={topic.id}>
                    <td>
                      <div className="font-display text-[16px] text-on-surface">{topic.title}</div>
                      {topic.description && (
                        <div className="line-clamp-1 text-[12px] text-on-surface-variant">
                          {topic.description}
                        </div>
                      )}
                    </td>
                    <td className="text-on-surface-variant">{topic.source}</td>
                    <td>
                      <AdminStatusBadge status={topic.status as TopicStatus} />
                    </td>
                    <td className="text-right">
                      <Link
                        href="/topics"
                        className="rounded bg-secondary px-3 py-1 text-label-sm text-on-secondary hover:brightness-110"
                      >
                        Review
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {!topicsQuery.isLoading && topics.length === 0 && (
            <p className="p-stack-md text-body-sm text-on-surface-variant">
              No discovered topics yet. Run trend discovery from the Topics page.
            </p>
          )}
        </AdminScrollCard>

        <div className="admin-card shrink-0 space-y-4 p-stack-md lg:col-span-4 lg:self-start">
          <h3 className="font-display text-headline-sm text-on-surface">Quick Actions</h3>
          <Link href="/topics" className="admin-btn-accent w-full">
            <span className="material-symbols-outlined text-[18px]">refresh</span>
            Sync Topics
          </Link>
          <Link href="/ideas" className="admin-btn-secondary w-full">
            <span className="material-symbols-outlined text-[18px]">lightbulb</span>
            Article Ideas
          </Link>
          <Link href="/jobs" className="admin-btn-secondary w-full">
            <span className="material-symbols-outlined text-[18px]">robot_2</span>
            AI Jobs
          </Link>
          <Link href="/audit" className="admin-btn-secondary w-full">
            <span className="material-symbols-outlined text-[18px]">history</span>
            Audit Log
          </Link>
        </div>
      </AdminPageBody>
    </AdminPageShell>
  );
}
