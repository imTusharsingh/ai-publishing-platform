'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listTopics, triggerTopicDiscovery } from '@/lib/topics-api';

export function TopicsPage() {
  const queryClient = useQueryClient();

  const topicsQuery = useQuery({
    queryKey: ['admin-topics'],
    queryFn: listTopics,
    refetchInterval: 10000,
  });

  const discoverMutation = useMutation({
    mutationFn: triggerTopicDiscovery,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-topics'] }),
  });

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Trending topics</h2>
          <p className="mt-2 text-gray-600">Discovered topics awaiting editorial review.</p>
        </div>
        <button
          type="button"
          onClick={() => discoverMutation.mutate()}
          disabled={discoverMutation.isPending}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60"
        >
          Run discovery
        </button>
      </div>

      <div className="mt-8 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {topicsQuery.isLoading && <p className="p-6 text-sm text-gray-500">Loading topics…</p>}
        {topicsQuery.isError && (
          <p className="p-6 text-sm text-red-600">Failed to load topics.</p>
        )}
        {topicsQuery.data && (
          <ul className="divide-y divide-gray-200">
            {topicsQuery.data.data.map((topic) => (
              <li key={topic.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-gray-900">{topic.title}</p>
                    <p className="mt-1 text-sm text-gray-500">{topic.description}</p>
                    <p className="mt-2 text-xs text-gray-400">
                      {topic.source} · score {topic.popularityScore} · {topic.status}
                      {topic.matchedCategoryName ? ` · ${topic.matchedCategoryName}` : ''}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
