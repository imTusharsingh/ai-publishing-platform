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
  AdminModal,
  AdminStatusBadge,
} from '@/components/admin-ui';
import { listCategories } from '@/lib/categories-api';
import {
  listTopics,
  triggerTopicDiscovery,
  updateTopic,
  updateTopicStatus,
} from '@/lib/topics-api';
import { createArticleIdeaFromTopic } from '@/lib/article-ideas-api';
import { getJob } from '@/lib/jobs-api';
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

function formatRelativeTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) {
    return 'just now';
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes} min ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} hr ago`;
  }

  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days} day${days === 1 ? '' : 's'} ago`;
  }

  const weeks = Math.floor(days / 7);
  if (weeks < 5) {
    return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
  }

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDiscoverySyncMessage(
  result: {
    created?: number;
    updated?: number;
    skipped?: number;
    fetched?: number;
  } | null,
): string {
  const created = result?.created ?? 0;
  const updated = result?.updated ?? 0;
  const skipped = result?.skipped ?? 0;
  const fetched = result?.fetched ?? 0;

  if (created > 0 && updated > 0) {
    return `Sync complete — ${created} new topic${created === 1 ? '' : 's'} added, ${updated} refreshed.`;
  }

  if (created > 0) {
    return `Sync complete — ${created} new topic${created === 1 ? '' : 's'} added.`;
  }

  if (updated > 0) {
    const skippedNote = skipped > 0 ? ` ${skipped} skipped (rejected or already used).` : '';
    return `Sync complete — ${updated} existing topic${updated === 1 ? '' : 's'} refreshed with latest scores.${skippedNote}`;
  }

  if (fetched === 0) {
    return 'Sync complete — no headlines returned from trend sources. Check worker logs and TREND_DISCOVERY_PROVIDER.';
  }

  const skippedNote = skipped > 0 ? ` (${skipped} rejected or already used)` : '';
  return `Sync complete — ${fetched} headline${fetched === 1 ? '' : 's'} fetched, all already in the database${skippedNote}. Check the All tab for existing items.`;
}

function formatExactTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function TopicsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('DISCOVERED');
  const [editingTopic, setEditingTopic] = useState<TopicSummary | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [generatingTopicId, setGeneratingTopicId] = useState<string | null>(null);

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
    queryFn: () => listTopics({ limit: 1, status: 'DISCOVERED' }),
  });

  const categoriesQuery = useQuery({
    queryKey: ['admin-categories'],
    queryFn: listCategories,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-topics'] });
    queryClient.invalidateQueries({ queryKey: ['admin-topics-stats'] });
  };

  async function waitForDiscoveryJob(jobId: string) {
    const deadline = Date.now() + 60_000;

    while (Date.now() < deadline) {
      const job = await getJob(jobId);
      if (job.state === 'completed') {
        return formatDiscoverySyncMessage(
          job.returnvalue as {
            created?: number;
            updated?: number;
            skipped?: number;
            fetched?: number;
          } | null,
        );
      }
      if (job.state === 'failed') {
        throw new Error(job.failedReason ?? 'Trend discovery job failed');
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    throw new Error('Trend discovery timed out after 60s — is the worker running?');
  }

  const discoverMutation = useMutation({
    mutationFn: async () => {
      setSyncMessage(null);
      const queued = await triggerTopicDiscovery();
      return waitForDiscoveryJob(queued.jobId);
    },
    onSuccess: (message) => {
      setSyncMessage(message);
      setError(null);
      invalidate();
    },
    onError: (err) => {
      setSyncMessage(null);
      setError(err instanceof ApiError ? err.message : 'Discovery failed');
    },
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
      setEditingTopic(null);
      setError(null);
      invalidate();
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Update failed'),
  });

  const generateIdeaMutation = useMutation({
    mutationFn: createArticleIdeaFromTopic,
    onMutate: (topicId) => {
      setGeneratingTopicId(topicId);
      setSyncMessage(null);
      setError(null);
    },
    onSuccess: () => {
      setGeneratingTopicId(null);
      setSyncMessage('Article idea generated — review it on the Ideas page.');
      invalidate();
      queryClient.invalidateQueries({ queryKey: ['admin-article-ideas'] });
    },
    onError: (err) => {
      setGeneratingTopicId(null);
      setError(err instanceof ApiError ? err.message : 'Idea generation failed');
    },
  });

  const startEdit = (topic: TopicSummary) => {
    setEditingTopic(topic);
    setEditTitle(topic.title);
    setEditDescription(topic.description ?? '');
    setEditCategoryId(topic.matchedCategoryId ?? '');
    setError(null);
  };

  const closeEditModal = () => {
    if (!updateMutation.isPending) {
      setEditingTopic(null);
    }
  };

  const handleSaveEdit = (event: FormEvent) => {
    event.preventDefault();
    if (!editingTopic) {
      return;
    }

    updateMutation.mutate({
      id: editingTopic.id,
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

      {discoverMutation.isPending && (
        <p className="mb-4 shrink-0 text-body-sm text-on-surface-variant">
          Running trend discovery… waiting for worker to finish.
        </p>
      )}
      {syncMessage && !discoverMutation.isPending && (
        <p className="mb-4 shrink-0 text-body-sm text-secondary">{syncMessage}</p>
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
                  <th>Added</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {topics.map((topic) => (
                  <tr key={topic.id}>
                    <td>
                      <div className="font-display text-on-surface">{topic.title}</div>
                      {topic.description && (
                        <div className="line-clamp-2 text-body-sm text-on-surface-variant">
                          {topic.description}
                        </div>
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
                    <td
                      className="whitespace-nowrap text-body-sm text-on-surface-variant"
                      title={formatExactTime(topic.discoveredAt)}
                    >
                      {formatRelativeTime(topic.discoveredAt)}
                    </td>
                    <td>
                      <AdminStatusBadge status={topic.status} />
                    </td>
                    <td className="text-right">
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
                        {topic.status === 'APPROVED' && (
                          <button
                            type="button"
                            onClick={() => generateIdeaMutation.mutate(topic.id)}
                            disabled={generatingTopicId === topic.id || !topic.matchedCategoryId}
                            title={
                              !topic.matchedCategoryId
                                ? 'Assign a category before generating an idea'
                                : undefined
                            }
                            className="admin-btn-primary px-3 py-1 text-label-sm disabled:opacity-60"
                          >
                            {generatingTopicId === topic.id ? 'Generating…' : 'Generate idea'}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => startEdit(topic)}
                          className="admin-btn-secondary px-3 py-1 text-label-sm"
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </AdminScrollCard>
      </AdminPageBody>

      {editingTopic && (
        <AdminModal
          open
          titleId="edit-topic-title"
          title="Edit topic"
          description="Update the topic details before approving it for article planning."
          onClose={closeEditModal}
          closeDisabled={updateMutation.isPending}
        >
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <label className="block">
              <span className="mb-1 block text-label-md text-on-surface">Title</span>
              <input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="admin-input"
                required
                minLength={5}
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-label-md text-on-surface">Description</span>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="admin-input"
                rows={4}
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-label-md text-on-surface">Category</span>
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
            </label>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={closeEditModal}
                className="admin-btn-secondary"
                disabled={updateMutation.isPending}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="admin-btn-primary"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </form>
        </AdminModal>
      )}
    </AdminPageShell>
  );
}
