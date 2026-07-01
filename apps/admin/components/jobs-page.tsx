'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AdminPageBody,
  AdminPageHeader,
  AdminPageShell,
  AdminScrollCard,
  AdminStatusBadge,
} from '@/components/admin-ui';
import { enqueuePingJob, listJobs } from '@/lib/jobs-api';

const JOB_TYPE_ICONS: Record<string, string> = {
  trend: 'query_stats',
  plan: 'psychology',
  article: 'edit_note',
  ping: 'robot_2',
};

function jobTypeIcon(name: string): string {
  const lower = name.toLowerCase();
  for (const [key, icon] of Object.entries(JOB_TYPE_ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return 'robot_2';
}

export function JobsPage() {
  const queryClient = useQueryClient();

  const jobsQuery = useQuery({
    queryKey: ['admin-jobs'],
    queryFn: () => listJobs(),
    refetchInterval: 5000,
  });

  const enqueueMutation = useMutation({
    mutationFn: () => enqueuePingJob(`Ping at ${new Date().toISOString()}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-jobs'] }),
  });

  const jobs = jobsQuery.data ?? [];
  const activeJobs = jobs.filter((j) => j.state === 'active' || j.state === 'waiting').length;
  const completedJobs = jobs.filter((j) => j.state === 'completed').length;
  const successRate =
    jobs.length > 0 ? `${((completedJobs / jobs.length) * 100).toFixed(1)}%` : '—';

  return (
    <AdminPageShell contentClassName="mx-auto max-w-container-max">
      <AdminPageHeader
        breadcrumb="AI Jobs"
        title="AI Agent Orchestration"
        description="Monitor background jobs, queue health, and worker activity."
        className="mb-stack-md shrink-0"
      >
        <span className="inline-flex items-center gap-2 rounded-full bg-secondary-container px-3 py-1 text-label-sm text-on-secondary-container">
          <span className="h-2 w-2 animate-pulse rounded-full bg-secondary" />
          {jobsQuery.isError ? 'System Degraded' : 'System Nominal'}
        </span>
        <button
          type="button"
          onClick={() => queryClient.invalidateQueries({ queryKey: ['admin-jobs'] })}
          className="rounded-lg p-2 text-on-surface-variant transition-colors hover:bg-surface-container"
          aria-label="Refresh"
        >
          <span className="material-symbols-outlined">refresh</span>
        </button>
        <button
          type="button"
          onClick={() => enqueueMutation.mutate()}
          disabled={enqueueMutation.isPending}
          className="admin-btn-primary"
        >
          <span className="material-symbols-outlined">add</span>
          Create New Job
        </button>
      </AdminPageHeader>

      <div className="mb-stack-md grid shrink-0 grid-cols-1 gap-gutter md:grid-cols-3">
        <StatCard label="Active jobs" value={String(activeJobs)} />
        <StatCard label="Success rate" value={successRate} accent />
        <StatCard label="Total jobs" value={String(jobs.length)} />
      </div>

      <AdminPageBody>
        <AdminScrollCard>
          {jobsQuery.isLoading && (
            <p className="p-6 text-body-sm text-on-surface-variant">Loading jobs…</p>
          )}
          {jobsQuery.isError && (
            <p className="p-6 text-body-sm text-on-error-container">
              Failed to load jobs. Is Redis running?
            </p>
          )}
          {jobs.length > 0 && (
            <table className="admin-table admin-table-sticky">
              <thead>
                <tr>
                  <th>Job Type</th>
                  <th>Entity Context</th>
                  <th>Status</th>
                  <th>Attempts</th>
                  <th className="text-right">Completion</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded bg-primary-container text-on-primary-container">
                          <span className="material-symbols-outlined">{jobTypeIcon(job.name)}</span>
                        </div>
                        <span className="text-label-md text-primary">{job.name}</span>
                      </div>
                    </td>
                    <td className="font-mono text-body-sm text-on-surface-variant">
                      {job.id.slice(0, 16)}…
                    </td>
                    <td>
                      <AdminStatusBadge status={job.state} />
                    </td>
                    <td className="text-on-surface-variant">{job.attemptsMade}</td>
                    <td className="text-right text-on-surface-variant">
                      {job.state === 'completed' ? '100%' : job.state === 'active' ? '…' : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {!jobsQuery.isLoading && jobs.length === 0 && !jobsQuery.isError && (
            <p className="p-6 text-body-sm text-on-surface-variant">No jobs in queue yet.</p>
          )}
        </AdminScrollCard>
      </AdminPageBody>
    </AdminPageShell>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="admin-card p-stack-md">
      <p className="mb-1 text-label-sm uppercase text-on-surface-variant">{label}</p>
      <p
        className={`font-display text-display leading-tight ${accent ? 'text-secondary' : 'text-primary'}`}
      >
        {value}
      </p>
    </div>
  );
}
