'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import type { JobStatusEntry } from '@repo/shared';
import {
  AdminInsightCard,
  AdminModal,
  AdminPageBody,
  AdminPageHeader,
  AdminPageShell,
  AdminScrollCard,
  AdminStatusBadge,
} from '@/components/admin-ui';
import { enqueuePingJob, listJobs, retryJob } from '@/lib/jobs-api';
import { formatRelativeTime } from '@/lib/format';
import { ApiError } from '@/lib/api';
import { cn } from '@/lib/cn';

const STATUS_FILTERS = [
  { id: '', label: 'All' },
  { id: 'active', label: 'Running' },
  { id: 'waiting', label: 'Queued' },
  { id: 'completed', label: 'Completed' },
  { id: 'failed', label: 'Failed' },
] as const;

const JOB_LABELS: Record<string, string> = {
  ping: 'Queue health check',
  'trend-discovery': 'Trend discovery',
  'article-writing': 'Article writing',
  embedding: 'Embedding generation',
  'duplicate-check': 'Duplicate check',
  quality: 'Quality gate',
  'daily-publishing': 'Daily publishing',
};

const JOB_ICONS: Record<string, string> = {
  ping: 'network_ping',
  'trend-discovery': 'query_stats',
  'article-writing': 'edit_note',
  embedding: 'hub',
  'duplicate-check': 'content_copy',
  quality: 'verified',
  'daily-publishing': 'schedule',
};

function parseStatusFilter(value: string | null): string {
  if (!value) {
    return '';
  }
  return STATUS_FILTERS.some((filter) => filter.id === value) ? value : '';
}

function jobLabel(name: string): string {
  return JOB_LABELS[name] ?? name.replace(/-/g, ' ');
}

function jobIcon(name: string): string {
  return JOB_ICONS[name] ?? 'robot_2';
}

function formatJobContext(job: JobStatusEntry): string {
  const data = job.data as Record<string, unknown> | null;
  if (!data) {
    return '—';
  }
  if (typeof data.ideaId === 'string') {
    return `Idea ${data.ideaId.slice(0, 8)}…`;
  }
  if (typeof data.articleId === 'string') {
    return `Article ${data.articleId.slice(0, 8)}…`;
  }
  if (typeof data.runId === 'string') {
    return `Run ${data.runId.slice(0, 8)}…`;
  }
  if (typeof data.message === 'string') {
    return data.message.length > 48 ? `${data.message.slice(0, 48)}…` : data.message;
  }
  return '—';
}

function formatTimestamp(value: number | null): string {
  if (!value) {
    return '—';
  }
  return formatRelativeTime(new Date(value).toISOString());
}

export function JobsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusFilter = parseStatusFilter(searchParams.get('status'));
  const queryClient = useQueryClient();
  const [detailJob, setDetailJob] = useState<JobStatusEntry | null>(null);
  const [retryingJobId, setRetryingJobId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const jobsQuery = useQuery({
    queryKey: ['admin-jobs'],
    queryFn: () => listJobs(50),
    refetchInterval: 5000,
  });

  const enqueueMutation = useMutation({
    mutationFn: () => enqueuePingJob(`Health check at ${new Date().toISOString()}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-jobs'] }),
  });

  const retryMutation = useMutation({
    mutationFn: retryJob,
    onMutate: (jobId) => {
      setRetryingJobId(jobId);
      setActionError(null);
    },
    onSuccess: (job) => {
      setDetailJob(job);
      queryClient.invalidateQueries({ queryKey: ['admin-jobs'] });
    },
    onError: (error) => {
      setActionError(error instanceof ApiError ? error.message : 'Failed to retry job');
    },
    onSettled: () => {
      setRetryingJobId(null);
    },
  });

  const jobs = jobsQuery.data ?? [];
  const runningCount = jobs.filter((job) => job.state === 'active').length;
  const queuedCount = jobs.filter(
    (job) => job.state === 'waiting' || job.state === 'delayed',
  ).length;
  const completedCount = jobs.filter((job) => job.state === 'completed').length;
  const failedCount = jobs.filter((job) => job.state === 'failed').length;
  const successRate =
    completedCount + failedCount > 0
      ? `${Math.round((completedCount / (completedCount + failedCount)) * 100)}%`
      : '—';

  const filteredJobs = useMemo(() => {
    if (!statusFilter) {
      return jobs;
    }
    if (statusFilter === 'waiting') {
      return jobs.filter((job) => job.state === 'waiting' || job.state === 'delayed');
    }
    return jobs.filter((job) => job.state === statusFilter);
  }, [jobs, statusFilter]);

  const setStatusFilter = (status: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (status) {
      params.set('status', status);
    } else {
      params.delete('status');
    }
    const query = params.toString();
    router.replace(query ? `/jobs?${query}` : '/jobs', { scroll: false });
  };

  const systemHealthy = !jobsQuery.isError && failedCount === 0;

  return (
    <AdminPageShell fillHeight={false}>
      <AdminPageHeader
        breadcrumb="AI Jobs"
        title="AI Agent Orchestration"
        description="Background workers for discovery, writing, quality checks, and publishing."
        className="mb-stack-md shrink-0"
      >
        <span
          className={cn(
            'inline-flex items-center gap-2 rounded-full px-3 py-1 text-label-sm',
            systemHealthy
              ? 'bg-secondary-container text-on-secondary-container'
              : 'bg-error-container text-on-error-container',
          )}
        >
          <span
            className={cn(
              'h-2 w-2 rounded-full',
              systemHealthy ? 'animate-pulse bg-secondary' : 'bg-error',
            )}
          />
          {jobsQuery.isError
            ? 'Queue offline'
            : failedCount > 0
              ? `${failedCount} failed`
              : 'Queue healthy'}
        </span>
        <button
          type="button"
          onClick={() => queryClient.invalidateQueries({ queryKey: ['admin-jobs'] })}
          className="admin-btn-secondary px-3 py-2"
          aria-label="Refresh jobs"
        >
          <span className="material-symbols-outlined text-[18px]">refresh</span>
        </button>
        <button
          type="button"
          onClick={() => enqueueMutation.mutate()}
          disabled={enqueueMutation.isPending || jobsQuery.isError}
          className="admin-btn-secondary"
        >
          <span className="material-symbols-outlined text-[18px]">network_ping</span>
          {enqueueMutation.isPending ? 'Pinging…' : 'Test queue'}
        </button>
      </AdminPageHeader>

      {actionError && (
        <p className="mb-4 shrink-0 text-body-sm text-on-error-container">{actionError}</p>
      )}

      <div className="bento-grid mb-stack-md shrink-0">
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <AdminInsightCard
            label="Running"
            value={String(runningCount)}
            icon="sync"
            meta={`${queuedCount} queued`}
            accent="primary"
          />
        </div>
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <AdminInsightCard
            label="Completed"
            value={String(completedCount)}
            icon="check_circle"
            meta="Recent window"
            accent="secondary"
          />
        </div>
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <AdminInsightCard
            label="Failed"
            value={String(failedCount)}
            icon="error"
            meta={failedCount > 0 ? 'Needs attention' : 'No failures'}
            accent="tertiary"
          />
        </div>
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <AdminInsightCard
            label="Success rate"
            value={successRate}
            icon="trending_up"
            meta="Completed vs failed"
            accent="primary"
          />
        </div>
      </div>

      <AdminPageBody className="pb-stack-lg">
        <AdminScrollCard
          header={
            <div className="flex flex-col gap-4 border-b border-outline-variant bg-surface-container-low px-stack-md py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-display text-headline-sm text-on-surface">Job queue</h2>
                <p className="mt-1 text-body-sm text-on-surface-variant">
                  {filteredJobs.length} of {jobs.length} recent jobs
                </p>
              </div>
              <div className="admin-filter-tabs min-w-0">
                {STATUS_FILTERS.map((filter) => (
                  <button
                    key={filter.id || 'all'}
                    type="button"
                    onClick={() => setStatusFilter(filter.id)}
                    className={cn(
                      'admin-filter-tab',
                      statusFilter === filter.id && 'admin-filter-tab-active',
                    )}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
          }
        >
          {jobsQuery.isLoading && (
            <p className="p-stack-md text-body-sm text-on-surface-variant">Loading jobs…</p>
          )}
          {jobsQuery.isError && (
            <div className="p-stack-lg text-center">
              <p className="text-body-md text-on-error-container">Failed to load jobs</p>
              <p className="mt-2 text-body-sm text-on-surface-variant">
                Redis may be offline. Start Redis and refresh to monitor the queue.
              </p>
            </div>
          )}
          {!jobsQuery.isLoading && !jobsQuery.isError && filteredJobs.length === 0 && (
            <div className="p-stack-lg text-center">
              <p className="text-body-md text-on-surface">No jobs in this queue</p>
              <p className="mt-2 text-body-sm text-on-surface-variant">
                {statusFilter === 'failed'
                  ? 'No failed jobs — the pipeline is running cleanly.'
                  : 'Generate articles from approved ideas or run a queue health check to see activity.'}
              </p>
              {!statusFilter && (
                <button
                  type="button"
                  onClick={() => enqueueMutation.mutate()}
                  disabled={enqueueMutation.isPending}
                  className="admin-btn-secondary mt-4"
                >
                  Test queue
                </button>
              )}
            </div>
          )}
          {filteredJobs.length > 0 && (
            <table className="admin-table admin-table-sticky">
              <thead>
                <tr>
                  <th>Job</th>
                  <th>Context</th>
                  <th>Status</th>
                  <th>Progress</th>
                  <th>Finished</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredJobs.map((job) => (
                  <JobRow
                    key={job.id}
                    job={job}
                    onDetails={setDetailJob}
                    onRetry={(jobId) => retryMutation.mutate(jobId)}
                    isRetrying={retryMutation.isPending && retryingJobId === job.id}
                  />
                ))}
              </tbody>
            </table>
          )}
        </AdminScrollCard>
      </AdminPageBody>

      <AdminModal
        open={Boolean(detailJob)}
        titleId="job-detail-title"
        title={detailJob ? jobLabel(detailJob.name) : 'Job details'}
        description={
          detailJob ? <span className="font-mono text-label-sm">{detailJob.id}</span> : undefined
        }
        onClose={() => setDetailJob(null)}
        className="max-h-[90vh] max-w-2xl overflow-y-auto"
      >
        {detailJob && (
          <JobDetailBody
            job={detailJob}
            onRetry={() => retryMutation.mutate(detailJob.id)}
            isRetrying={retryMutation.isPending && retryingJobId === detailJob.id}
          />
        )}
      </AdminModal>
    </AdminPageShell>
  );
}

function JobRow({
  job,
  onDetails,
  onRetry,
  isRetrying,
}: {
  job: JobStatusEntry;
  onDetails: (job: JobStatusEntry) => void;
  onRetry: (jobId: string) => void;
  isRetrying: boolean;
}) {
  const progress =
    job.state === 'completed'
      ? 100
      : job.state === 'active' && job.progress > 0
        ? Math.round(job.progress)
        : null;

  return (
    <tr>
      <td>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-container text-on-primary-container">
            <span className="material-symbols-outlined">{jobIcon(job.name)}</span>
          </div>
          <div>
            <div className="font-display text-on-surface">{jobLabel(job.name)}</div>
            <div className="font-mono text-label-sm text-on-surface-variant">{job.name}</div>
          </div>
        </div>
      </td>
      <td className="text-body-sm text-on-surface-variant">{formatJobContext(job)}</td>
      <td>
        <AdminStatusBadge status={job.state} />
        {job.attemptsMade > 1 && (
          <p className="mt-1 text-label-sm text-on-surface-variant">{job.attemptsMade} attempts</p>
        )}
      </td>
      <td className="min-w-[8rem]">
        {progress !== null ? (
          <div>
            <div className="h-1.5 overflow-hidden rounded-full bg-surface-container-high">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-1 text-label-sm text-on-surface-variant">{progress}%</p>
          </div>
        ) : (
          <span className="text-on-surface-variant">—</span>
        )}
      </td>
      <td className="whitespace-nowrap text-body-sm text-on-surface-variant">
        {formatTimestamp(job.finishedOn ?? job.processedOn)}
      </td>
      <td className="text-right">
        <div className="flex justify-end gap-2">
          {job.state === 'failed' && (
            <button
              type="button"
              onClick={() => onRetry(job.id)}
              disabled={isRetrying}
              className="admin-btn-primary shrink-0 px-3 py-1 text-label-sm disabled:opacity-60"
            >
              {isRetrying ? 'Retrying…' : 'Retry'}
            </button>
          )}
          <button
            type="button"
            onClick={() => onDetails(job)}
            className="admin-btn-secondary shrink-0 px-3 py-1 text-label-sm"
          >
            Details
          </button>
        </div>
      </td>
    </tr>
  );
}

function JobDetailBody({
  job,
  onRetry,
  isRetrying,
}: {
  job: JobStatusEntry;
  onRetry: () => void;
  isRetrying: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <AdminStatusBadge status={job.state} />
        <span className="text-body-sm text-on-surface-variant">Queue: {job.queue}</span>
        {job.state === 'failed' && (
          <button
            type="button"
            onClick={onRetry}
            disabled={isRetrying}
            className="admin-btn-primary ml-auto px-3 py-1 text-label-sm disabled:opacity-60"
          >
            {isRetrying ? 'Retrying…' : 'Retry job'}
          </button>
        )}
      </div>

      <dl className="grid gap-3 text-body-sm sm:grid-cols-2">
        <DetailItem label="Started" value={formatTimestamp(job.processedOn)} />
        <DetailItem label="Finished" value={formatTimestamp(job.finishedOn)} />
        <DetailItem label="Attempts" value={String(job.attemptsMade)} />
        <DetailItem label="Context" value={formatJobContext(job)} />
      </dl>

      {job.failedReason && (
        <div className="rounded-xl border border-error/30 bg-error-container/30 p-4">
          <p className="text-label-sm uppercase tracking-wider text-on-error-container">Failure</p>
          <p className="mt-2 text-body-sm text-on-error-container">{job.failedReason}</p>
        </div>
      )}

      {job.data !== null && job.data !== undefined && (
        <JsonBlock label="Input data" value={job.data} />
      )}

      {job.returnvalue !== null && job.returnvalue !== undefined && (
        <JsonBlock label="Result" value={job.returnvalue} />
      )}
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-label-sm text-on-surface-variant">{label}</dt>
      <dd className="mt-0.5 text-on-surface">{value}</dd>
    </div>
  );
}

function JsonBlock({ label, value }: { label: string; value: unknown }) {
  return (
    <div>
      <p className="mb-2 text-label-sm uppercase tracking-wider text-on-surface-variant">{label}</p>
      <pre className="overflow-x-auto rounded-lg bg-surface-container-low p-4 font-mono text-body-sm text-on-surface">
        {JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}
