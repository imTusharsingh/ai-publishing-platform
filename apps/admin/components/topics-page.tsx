'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FormEvent, useState } from 'react';
import type { TopicStatus, TopicSummary } from '@repo/shared';
import {
  AdminInsightCard,
  AdminPageBody,
  AdminPageHeader,
  AdminPageShell,
  AdminScrollCard,
  AdminStatusBadge,
} from '@/components/admin-ui';
import { listCategories } from '@/lib/categories-api';
import {
  listTopics,
  triggerTopicDiscovery,
  updateTopic,
  updateTopicStatus,
} from '@/lib/topics-api';
import { ApiError } from '@/lib/api';
import { cn } from '@/lib/cn';

const QUEUE_FILTERS = [
  { id: 'DISCOVERED', label: 'Pending' },
  { id: 'APPROVED', label: 'Approved' },
  { id: '', label: 'All' },
] as const;

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

  const allTopicsQuery = useQuery({
    queryKey: ['admin-topics-stats'],
    queryFn: () => listTopics({ limit: 1 }),
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

  const topics = topicsQuery.data?.data ?? [];
  const totalTopics = allTopicsQuery.data?.meta.total ?? 0;

  return (
    <AdminPageShell>
      <AdminPageHeader
        breadcrumb="Topics Discovery"
        title="AI Topic Discovery"
        description="Real-time trending news entities across global sources."
        className="mb-stack-md shrink-0"
      >
        <button
          type="button"
          onClick={() => discoverMutation.mutate()}
          disabled={discoverMutation.isPending}
          className="admin-btn-accent"
        >
          <span className="material-symbols-outlined">refresh</span>
          {discoverMutation.isPending ? 'Syncing…' : 'Sync Now'}
        </button>
      </AdminPageHeader>

      {discoverMutation.isSuccess && (
        <p className="mb-4 shrink-0 text-body-sm text-secondary">
          Discovery job queued. New topics appear after the worker finishes.
        </p>
      )}
      {error && <p className="mb-4 shrink-0 text-body-sm text-on-error-container">{error}</p>}

      <div className="bento-grid mb-stack-md shrink-0">
        <div className="col-span-12 md:col-span-4">
          <AdminInsightCard
            label="Active Discovered Topics"
            value={String(totalTopics)}
            icon="trending_up"
            meta="+ live"
            accent="primary"
          />
        </div>
        <div className="col-span-12 md:col-span-4">
          <AdminInsightCard
            label="Queue Size"
            value={String(topicsQuery.data?.meta.total ?? 0)}
            icon="verified"
            meta="Current filter"
            accent="secondary"
          />
        </div>
        <div className="col-span-12 md:col-span-4">
          <AdminInsightCard
            label="Sources Active"
            value="3"
            icon="hub"
            meta="HN · Reddit · News"
            accent="tertiary"
          />
        </div>
      </div>

      <AdminPageBody>
        <AdminScrollCard
          header={
            <div className="flex items-center justify-between border-b border-outline-variant bg-surface-bright px-6 py-4">
              <h2 className="font-display text-headline-sm text-on-surface">Queue</h2>
              <div className="admin-filter-tabs">
                {QUEUE_FILTERS.map((filter) => (
                  <button
                    key={filter.id}
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
          {topicsQuery.isLoading && (
            <p className="p-6 text-body-sm text-on-surface-variant">Loading topics…</p>
          )}
          {topicsQuery.isError && (
            <p className="p-6 text-body-sm text-on-error-container">Failed to load topics.</p>
          )}
          {topics.length === 0 && !topicsQuery.isLoading && (
            <p className="p-6 text-body-sm text-on-surface-variant">No topics for this filter.</p>
          )}

          {topics.length > 0 && (
            <table className="admin-table admin-table-sticky">
              <thead>
                <tr>
                  <th>Topic / Entity</th>
                  <th>Source</th>
                  <th>Popularity</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {topics.map((topic) => (
                  <tr key={topic.id}>
                    <td>
                      {editingId === topic.id ? (
                        <form
                          onSubmit={(event) => handleSaveEdit(event, topic.id)}
                          className="space-y-2 py-2"
                        >
                          <input
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="admin-input"
                            required
                            minLength={5}
                          />
                          <textarea
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            className="admin-input"
                            rows={2}
                          />
                          <select
                            value={editCategoryId}
                            onChange={(e) => setEditCategoryId(e.target.value)}
                            className="admin-input"
                          >
                            <option value="">Uncategorized</option>
                            {categoriesQuery.data?.data.map((category) => (
                              <option key={category.id} value={category.id}>
                                {category.name}
                              </option>
                            ))}
                          </select>
                          <div className="flex gap-2">
                            <button
                              type="submit"
                              className="admin-btn-primary px-3 py-1.5 text-label-sm"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="admin-btn-secondary px-3 py-1.5 text-label-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : (
                        <>
                          <div className="font-display text-on-surface">{topic.title}</div>
                          {topic.description && (
                            <div className="line-clamp-2 text-body-sm text-on-surface-variant">
                              {topic.description}
                            </div>
                          )}
                        </>
                      )}
                    </td>
                    <td className="text-on-surface-variant">{topic.source}</td>
                    <td>
                      <div className="h-2 w-24 overflow-hidden rounded-full bg-surface-container-high">
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${Math.min(100, topic.popularityScore)}%` }}
                        />
                      </div>
                    </td>
                    <td className="text-on-surface-variant">{topic.matchedCategoryName ?? '—'}</td>
                    <td>
                      <AdminStatusBadge status={topic.status} />
                    </td>
                    <td className="text-right">
                      {editingId !== topic.id && (
                        <div className="flex justify-end gap-2">
                          {canReview(topic.status) && (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  statusMutation.mutate({ id: topic.id, status: 'APPROVED' })
                                }
                                className="rounded bg-secondary px-3 py-1 text-label-sm text-on-secondary"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  statusMutation.mutate({ id: topic.id, status: 'REJECTED' })
                                }
                                className="admin-btn-secondary px-3 py-1 text-label-sm"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            onClick={() => startEdit(topic)}
                            className="admin-btn-secondary px-3 py-1 text-label-sm"
                          >
                            Edit
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </AdminScrollCard>
      </AdminPageBody>
    </AdminPageShell>
  );
}
