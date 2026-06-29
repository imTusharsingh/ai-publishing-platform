'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FormEvent, useState } from 'react';
import type { TopicStatus, TopicSummary } from '@repo/shared';
import { listCategories } from '@/lib/categories-api';
import {
  listTopics,
  triggerTopicDiscovery,
  updateTopic,
  updateTopicStatus,
} from '@/lib/topics-api';
import { ApiError } from '@/lib/api';

const STATUS_OPTIONS: TopicStatus[] = [
  'DISCOVERED',
  'SUGGESTED',
  'APPROVED',
  'REJECTED',
  'USED',
  'EXPIRED',
];

const STATUS_STYLES: Record<TopicStatus, string> = {
  DISCOVERED: 'bg-blue-100 text-blue-800',
  SUGGESTED: 'bg-amber-100 text-amber-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  USED: 'bg-gray-100 text-gray-700',
  EXPIRED: 'bg-gray-100 text-gray-500',
};

function canReview(status: TopicStatus): boolean {
  return status === 'DISCOVERED' || status === 'SUGGESTED';
}

export function TopicsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('DISCOVERED');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [error, setError] = useState<string | null>(null);

  const topicsQuery = useQuery({
    queryKey: ['admin-topics', statusFilter],
    queryFn: () =>
      listTopics({
        limit: 50,
        status: (statusFilter || undefined) as TopicStatus | undefined,
      }),
    refetchInterval: 10000,
  });

  const categoriesQuery = useQuery({
    queryKey: ['admin-categories'],
    queryFn: listCategories,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-topics'] });

  const discoverMutation = useMutation({
    mutationFn: triggerTopicDiscovery,
    onSuccess: () => invalidate(),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TopicStatus }) =>
      updateTopicStatus(id, status),
    onSuccess: () => {
      setError(null);
      invalidate();
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Status update failed'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateTopic>[1] }) =>
      updateTopic(id, data),
    onSuccess: () => {
      setEditingId(null);
      setError(null);
      invalidate();
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Update failed'),
  });

  const startEdit = (topic: TopicSummary) => {
    setEditingId(topic.id);
    setEditTitle(topic.title);
    setEditDescription(topic.description ?? '');
    setEditCategoryId(topic.matchedCategoryId ?? '');
    setError(null);
  };

  const handleSaveEdit = (event: FormEvent, topicId: string) => {
    event.preventDefault();
    updateMutation.mutate({
      id: topicId,
      data: {
        title: editTitle,
        description: editDescription,
        matchedCategoryId: editCategoryId || null,
      },
    });
  };

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Trending topics</h2>
          <p className="mt-2 text-gray-600">
            Review discovered trends — approve before generating ideas.
          </p>
        </div>
        <button
          type="button"
          onClick={() => discoverMutation.mutate()}
          disabled={discoverMutation.isPending}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60"
        >
          {discoverMutation.isPending ? 'Discovering…' : 'Run discovery'}
        </button>
      </div>

      {discoverMutation.isSuccess && (
        <p className="mt-4 text-sm text-green-700">
          Discovery job queued. New topics appear after the worker finishes (usually within 15s).
        </p>
      )}

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        {topicsQuery.data && (
          <p className="text-sm text-gray-500">
            Showing {topicsQuery.data.data.length} of {topicsQuery.data.meta.total}
          </p>
        )}
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {topicsQuery.isLoading && <p className="p-6 text-sm text-gray-500">Loading topics…</p>}
        {topicsQuery.isError && <p className="p-6 text-sm text-red-600">Failed to load topics.</p>}
        {topicsQuery.data?.data.length === 0 && !topicsQuery.isLoading && (
          <p className="p-6 text-sm text-gray-500">No topics for this filter.</p>
        )}
        {topicsQuery.data && topicsQuery.data.data.length > 0 && (
          <ul className="divide-y divide-gray-200">
            {topicsQuery.data.data.map((topic) => (
              <li key={topic.id} className="p-4">
                {editingId === topic.id ? (
                  <form onSubmit={(event) => handleSaveEdit(event, topic.id)} className="space-y-3">
                    <label className="block text-sm">
                      <span className="text-gray-700">Title</span>
                      <input
                        value={editTitle}
                        onChange={(event) => setEditTitle(event.target.value)}
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                        required
                        minLength={5}
                      />
                    </label>
                    <label className="block text-sm">
                      <span className="text-gray-700">Description</span>
                      <textarea
                        value={editDescription}
                        onChange={(event) => setEditDescription(event.target.value)}
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                        rows={3}
                      />
                    </label>
                    <label className="block text-sm">
                      <span className="text-gray-700">Category</span>
                      <select
                        value={editCategoryId}
                        onChange={(event) => setEditCategoryId(event.target.value)}
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                      >
                        <option value="">Uncategorized</option>
                        {categoriesQuery.data?.data.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={updateMutation.isPending}
                        className="rounded-lg bg-gray-900 px-3 py-1.5 text-sm text-white hover:bg-gray-800 disabled:opacity-60"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-gray-900">{topic.title}</p>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[topic.status]}`}
                        >
                          {topic.status}
                        </span>
                        {topic.discoveryProvider && (
                          <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-800">
                            {topic.discoveryProvider}
                          </span>
                        )}
                      </div>
                      {topic.description && (
                        <p className="mt-1 text-sm text-gray-500">{topic.description}</p>
                      )}
                      <p className="mt-2 text-xs text-gray-400">
                        {topic.source} · score {topic.popularityScore}
                        {topic.matchedCategoryName ? ` · ${topic.matchedCategoryName}` : ''}
                        {topic.sourceUrl && (
                          <>
                            {' · '}
                            <a
                              href={topic.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              Source
                            </a>
                          </>
                        )}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {canReview(topic.status) && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              statusMutation.mutate({ id: topic.id, status: 'APPROVED' })
                            }
                            className="rounded-lg bg-green-700 px-3 py-1.5 text-sm text-white hover:bg-green-800"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              statusMutation.mutate({ id: topic.id, status: 'SUGGESTED' })
                            }
                            className="rounded-lg border border-amber-300 px-3 py-1.5 text-sm text-amber-900 hover:bg-amber-50"
                          >
                            Suggest
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              statusMutation.mutate({ id: topic.id, status: 'REJECTED' })
                            }
                            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => startEdit(topic)}
                        className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
