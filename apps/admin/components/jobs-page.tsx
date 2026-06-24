'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { enqueuePingJob, listJobs } from '@/lib/jobs-api';

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

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Jobs</h2>
          <p className="mt-2 text-gray-600">Monitor BullMQ jobs. Dev queue UI at /admin/queues.</p>
        </div>
        <button
          type="button"
          onClick={() => enqueueMutation.mutate()}
          disabled={enqueueMutation.isPending}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60"
        >
          Enqueue ping job
        </button>
      </div>

      <div className="mt-8 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {jobsQuery.isLoading && <p className="p-6 text-sm text-gray-500">Loading jobs…</p>}
        {jobsQuery.isError && (
          <p className="p-6 text-sm text-red-600">Failed to load jobs. Is Redis running?</p>
        )}
        {jobsQuery.data && (
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-700">ID</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Name</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">State</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Attempts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {jobsQuery.data.map((job) => (
                <tr key={job.id}>
                  <td className="px-4 py-3 font-mono text-xs text-gray-800">{job.id}</td>
                  <td className="px-4 py-3 text-gray-900">{job.name}</td>
                  <td className="px-4 py-3 text-gray-600">{job.state}</td>
                  <td className="px-4 py-3 text-gray-600">{job.attemptsMade}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
