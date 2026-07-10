'use client';

import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, useState } from 'react';
import type { ArticleIdeaStatus, ArticleIdeaSummary } from '@repo/shared';
import {
  createArticleIdea,
  createArticleIdeaFromTopic,
  listArticleIdeas,
  updateArticleIdeaStatus,
} from '@/lib/article-ideas-api';
import { listCategories } from '@/lib/categories-api';
import { listTopics } from '@/lib/topics-api';
import { generateArticleFromIdea } from '@/lib/articles-api';
import { ApiError } from '@/lib/api';
import { formatRelativeTime } from '@/lib/format';
import { cn } from '@/lib/cn';
import {
  AdminInsightCard,
  AdminModal,
  AdminPageBody,
  AdminPageHeader,
  AdminPageShell,
  AdminScrollCard,
  AdminStatusBadge,
} from '@/components/admin-ui';

const STATUS_OPTIONS: ArticleIdeaStatus[] = [
  'DRAFT',
  'APPROVED',
  'DUPLICATE_REJECTED',
  'GENERATING',
  'FAILED',
];

const STATUS_FILTERS = [
  { id: '', label: 'All' },
  { id: 'DRAFT', label: 'Draft' },
  { id: 'APPROVED', label: 'Ready' },
  { id: 'GENERATING', label: 'Generating' },
  { id: 'FAILED', label: 'Failed' },
  { id: 'DUPLICATE_REJECTED', label: 'Rejected' },
] as const;

const COUNT_STATUSES = ['', 'DRAFT', 'APPROVED', 'GENERATING'] as const;

function parseStatusFilter(value: string | null): string {
  if (!value) {
    return '';
  }
  return STATUS_OPTIONS.includes(value as ArticleIdeaStatus) ? value : '';
}

function statusLabel(status: string): string {
  return STATUS_FILTERS.find((filter) => filter.id === status)?.label ?? status.replace(/_/g, ' ');
}

export function ArticleIdeasPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusFilter = parseStatusFilter(searchParams.get('status'));
  const queryClient = useQueryClient();

  const [createOpen, setCreateOpen] = useState(false);
  const [fromTopicOpen, setFromTopicOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [generatingIdeaId, setGeneratingIdeaId] = useState<string | null>(null);
  const [generatingTopicId, setGeneratingTopicId] = useState<string | null>(null);

  const ideasQuery = useQuery({
    queryKey: ['admin-article-ideas', statusFilter],
    queryFn: () =>
      listArticleIdeas({
        limit: 50,
        status: statusFilter || undefined,
      }),
    refetchInterval: (query) =>
      query.state.data?.data.some((idea) => idea.status === 'GENERATING') ? 3000 : false,
  });

  const countQueries = useQueries({
    queries: COUNT_STATUSES.map((status) => ({
      queryKey: ['admin-article-ideas-count', status || 'all'],
      queryFn: () =>
        listArticleIdeas({
          limit: 1,
          status: status || undefined,
        }),
    })),
  });

  const categoriesQuery = useQuery({
    queryKey: ['admin-categories'],
    queryFn: listCategories,
  });

  const topicsQuery = useQuery({
    queryKey: ['admin-topics', 'approved'],
    queryFn: () => listTopics({ status: 'APPROVED', limit: 50 }),
    enabled: fromTopicOpen,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-article-ideas'] });
    queryClient.invalidateQueries({ queryKey: ['admin-article-ideas-count'] });
    queryClient.invalidateQueries({ queryKey: ['admin-topics'] });
    queryClient.invalidateQueries({ queryKey: ['admin-articles'] });
  };

  const createMutation = useMutation({
    mutationFn: createArticleIdea,
    onSuccess: () => {
      setTitle('');
      setSummary('');
      setCategoryId('');
      setError(null);
      setCreateOpen(false);
      invalidate();
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Create failed'),
  });

  const fromTopicMutation = useMutation({
    mutationFn: createArticleIdeaFromTopic,
    onMutate: (topicId) => setGeneratingTopicId(topicId),
    onSuccess: () => {
      setError(null);
      setFromTopicOpen(false);
      invalidate();
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Generation failed'),
    onSettled: () => setGeneratingTopicId(null),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ArticleIdeaStatus }) =>
      updateArticleIdeaStatus(id, { status }),
    onSuccess: invalidate,
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Status update failed'),
  });

  const generateMutation = useMutation({
    mutationFn: generateArticleFromIdea,
    onMutate: (id) => setGeneratingIdeaId(id),
    onSuccess: invalidate,
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Generation failed'),
    onSettled: () => setGeneratingIdeaId(null),
  });

  const handleCreate = (event: FormEvent) => {
    event.preventDefault();
    if (!categoryId) {
      setError('Select a category');
      return;
    }

    createMutation.mutate({
      categoryId,
      title,
      summary: summary || undefined,
    });
  };

  const setStatusFilter = (status: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (status) {
      params.set('status', status);
    } else {
      params.delete('status');
    }
    const query = params.toString();
    router.replace(query ? `/ideas?${query}` : '/ideas', { scroll: false });
  };

  const ideas = ideasQuery.data?.data ?? [];
  const availableTopics = topicsQuery.data?.data.filter((topic) => topic.matchedCategoryId) ?? [];
  const totalCount = countQueries[0]?.data?.meta.total ?? 0;
  const draftCount = countQueries[1]?.data?.meta.total ?? 0;
  const readyCount = countQueries[2]?.data?.meta.total ?? 0;
  const generatingCount = countQueries[3]?.data?.meta.total ?? 0;

  return (
    <AdminPageShell fillHeight={false}>
      <AdminPageHeader
        breadcrumb="Article Ideas"
        title="Idea Pipeline"
        description="Review drafts, approve for writing, and generate articles from editorial ideas."
        className="mb-stack-md shrink-0"
      >
        <button
          type="button"
          onClick={() => {
            setError(null);
            setFromTopicOpen(true);
          }}
          className="admin-btn-secondary"
        >
          <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
          From topic
        </button>
        <button
          type="button"
          onClick={() => {
            setError(null);
            setCreateOpen(true);
          }}
          className="admin-btn-primary"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Create idea
        </button>
      </AdminPageHeader>

      {error && <p className="mb-4 shrink-0 text-body-sm text-on-error-container">{error}</p>}

      <div className="bento-grid mb-stack-md shrink-0">
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <AdminInsightCard
            label="Total ideas"
            value={String(totalCount)}
            icon="lightbulb"
            meta="All statuses"
            accent="primary"
          />
        </div>
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <AdminInsightCard
            label="Draft queue"
            value={String(draftCount)}
            icon="edit_note"
            meta="Needs review"
            accent="tertiary"
          />
        </div>
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <AdminInsightCard
            label="Ready to write"
            value={String(readyCount)}
            icon="check_circle"
            meta="Approved for generation"
            accent="secondary"
          />
        </div>
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <AdminInsightCard
            label="Generating"
            value={String(generatingCount)}
            icon="sync"
            meta="In progress"
            accent="primary"
          />
        </div>
      </div>

      <AdminPageBody className="pb-stack-lg">
        <AdminScrollCard
          header={
            <div className="flex flex-col gap-4 border-b border-outline-variant bg-surface-container-low px-stack-md py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-display text-headline-sm text-on-surface">
                  {statusFilter ? `${statusLabel(statusFilter)} ideas` : 'All ideas'}
                </h2>
                <p className="mt-1 text-body-sm text-on-surface-variant">
                  {ideasQuery.data?.meta.total ?? 0} matching this filter
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
          {ideasQuery.isLoading && (
            <p className="p-stack-md text-body-sm text-on-surface-variant">Loading ideas…</p>
          )}
          {ideasQuery.isError && (
            <p className="p-stack-md text-body-sm text-on-error-container">Failed to load ideas.</p>
          )}
          {!ideasQuery.isLoading && ideas.length === 0 && (
            <div className="p-stack-lg text-center">
              <p className="text-body-md text-on-surface">No ideas in this queue</p>
              <p className="mt-2 text-body-sm text-on-surface-variant">
                {statusFilter === 'APPROVED'
                  ? 'Approve draft ideas or generate from approved topics.'
                  : statusFilter === 'DRAFT'
                    ? 'Create an idea manually or generate one from the Topics page.'
                    : 'Create an idea or generate from an approved topic to get started.'}
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setCreateOpen(true)}
                  className="admin-btn-primary"
                >
                  Create idea
                </button>
                <button
                  type="button"
                  onClick={() => setFromTopicOpen(true)}
                  className="admin-btn-secondary"
                >
                  From topic
                </button>
                <Link href="/topics" className="admin-btn-secondary">
                  Go to topics
                </Link>
              </div>
            </div>
          )}
          {ideas.length > 0 && (
            <table className="admin-table admin-table-sticky">
              <thead>
                <tr>
                  <th>Idea</th>
                  <th>Category</th>
                  <th>Source</th>
                  <th>Added</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {ideas.map((idea) => (
                  <IdeaRow
                    key={idea.id}
                    idea={idea}
                    generatingIdeaId={generatingIdeaId}
                    statusUpdatingId={
                      statusMutation.isPending ? (statusMutation.variables?.id ?? null) : null
                    }
                    onApprove={(id) => statusMutation.mutate({ id, status: 'APPROVED' })}
                    onReject={(id) => statusMutation.mutate({ id, status: 'DUPLICATE_REJECTED' })}
                    onGenerate={(id) => generateMutation.mutate(id)}
                    generatePending={generateMutation.isPending}
                  />
                ))}
              </tbody>
            </table>
          )}
        </AdminScrollCard>
      </AdminPageBody>

      <AdminModal
        open={createOpen}
        titleId="create-idea-title"
        title="Create idea"
        description="Add a manual editorial idea before article generation."
        onClose={() => {
          if (!createMutation.isPending) {
            setCreateOpen(false);
          }
        }}
        closeDisabled={createMutation.isPending}
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <label className="block text-body-sm">
            <span className="text-on-surface-variant">Category</span>
            <select
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              className="admin-input mt-1"
              required
            >
              <option value="">Select category</option>
              {categoriesQuery.data?.data.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-body-sm">
            <span className="text-on-surface-variant">Title</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Article title"
              className="admin-input mt-1"
              required
              minLength={5}
            />
          </label>
          <label className="block text-body-sm">
            <span className="text-on-surface-variant">Summary (optional)</span>
            <textarea
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
              placeholder="Brief editorial summary"
              className="admin-input mt-1"
              rows={3}
            />
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="admin-btn-secondary"
              disabled={createMutation.isPending}
            >
              Cancel
            </button>
            <button type="submit" className="admin-btn-primary" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating…' : 'Create idea'}
            </button>
          </div>
        </form>
      </AdminModal>

      <AdminModal
        open={fromTopicOpen}
        titleId="from-topic-title"
        title="Generate from topic"
        description="Create an idea from an approved topic with a matched category."
        onClose={() => {
          if (!fromTopicMutation.isPending) {
            setFromTopicOpen(false);
          }
        }}
        closeDisabled={fromTopicMutation.isPending}
        className="max-w-3xl"
      >
        {topicsQuery.isLoading && (
          <p className="text-body-sm text-on-surface-variant">Loading approved topics…</p>
        )}
        {availableTopics.length === 0 && !topicsQuery.isLoading && (
          <div className="rounded-lg border border-outline-variant bg-surface-container-low p-stack-md text-center">
            <p className="text-body-sm text-on-surface-variant">
              No approved topics with a category. Approve and categorize topics first.
            </p>
            <Link href="/topics" className="admin-btn-secondary mt-4 inline-flex">
              Go to topics
            </Link>
          </div>
        )}
        {availableTopics.length > 0 && (
          <ul className="max-h-[24rem] divide-y divide-outline-variant overflow-y-auto rounded-lg border border-outline-variant">
            {availableTopics.map((topic) => (
              <li key={topic.id} className="flex items-start justify-between gap-4 p-4">
                <div className="min-w-0">
                  <p className="font-medium text-on-surface">{topic.title}</p>
                  <p className="mt-1 text-label-sm text-on-surface-variant">
                    {topic.matchedCategoryName ?? 'Uncategorized'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => fromTopicMutation.mutate(topic.id)}
                  disabled={fromTopicMutation.isPending}
                  className="admin-btn-primary shrink-0 px-3 py-1.5 text-label-sm disabled:opacity-60"
                >
                  {generatingTopicId === topic.id ? 'Generating…' : 'Generate'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </AdminModal>
    </AdminPageShell>
  );
}

function IdeaRow({
  idea,
  generatingIdeaId,
  statusUpdatingId,
  onApprove,
  onReject,
  onGenerate,
  generatePending,
}: {
  idea: ArticleIdeaSummary;
  generatingIdeaId: string | null;
  statusUpdatingId: string | null;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onGenerate: (id: string) => void;
  generatePending: boolean;
}) {
  const isUpdatingStatus = statusUpdatingId === idea.id;
  const isGenerating = generatePending && generatingIdeaId === idea.id;

  return (
    <tr>
      <td className="max-w-md">
        <div className="font-display text-on-surface">{idea.title}</div>
        {idea.summary && (
          <p className="mt-1 line-clamp-2 text-body-sm text-on-surface-variant">{idea.summary}</p>
        )}
        {idea.outline && idea.outline.length > 0 && (
          <details className="mt-2">
            <summary className="cursor-pointer text-label-sm text-primary">
              Outline · {idea.outline.length} sections
            </summary>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-body-sm text-on-surface-variant">
              {idea.outline.map((section) => (
                <li key={section.heading}>{section.heading}</li>
              ))}
            </ul>
          </details>
        )}
        {idea.contentPlan && (
          <details className="mt-2">
            <summary className="cursor-pointer text-label-sm text-secondary">
              Content plan · {idea.contentPlan.outline.length} sections ·{' '}
              {idea.contentPlan.imageSuggestions.length} images
            </summary>
            {idea.contentPlan.narrativeNotes && (
              <p className="mt-2 text-body-sm text-on-surface-variant">
                {idea.contentPlan.narrativeNotes}
              </p>
            )}
            <ul className="mt-2 list-disc space-y-1 pl-5 text-body-sm text-on-surface-variant">
              {idea.contentPlan.outline.map((section) => (
                <li key={section.heading}>{section.heading}</li>
              ))}
            </ul>
          </details>
        )}
        <p className="mt-2 font-mono text-label-sm text-on-surface-variant">{idea.slugCandidate}</p>
      </td>
      <td className="whitespace-nowrap text-on-surface-variant">{idea.categoryName ?? '—'}</td>
      <td className="max-w-[12rem]">
        <p className="line-clamp-2 text-body-sm text-on-surface-variant">
          {idea.trendingTopicTitle ?? 'Manual'}
        </p>
      </td>
      <td className="whitespace-nowrap text-body-sm text-on-surface-variant">
        {formatRelativeTime(idea.createdAt)}
      </td>
      <td>
        <AdminStatusBadge status={idea.status} />
      </td>
      <td className="text-right">
        <div className="flex justify-end gap-2">
          {idea.status === 'DRAFT' && (
            <>
              <button
                type="button"
                onClick={() => onApprove(idea.id)}
                disabled={isUpdatingStatus}
                className="admin-btn-accent shrink-0 px-3 py-1 text-label-sm disabled:opacity-60"
              >
                Approve
              </button>
              <button
                type="button"
                onClick={() => onReject(idea.id)}
                disabled={isUpdatingStatus}
                className="admin-btn-secondary shrink-0 px-3 py-1 text-label-sm disabled:opacity-60"
              >
                Reject
              </button>
            </>
          )}
          {(idea.status === 'APPROVED' || idea.status === 'FAILED') && !idea.hasArticle && (
            <button
              type="button"
              onClick={() => onGenerate(idea.id)}
              disabled={isGenerating}
              className="admin-btn-primary shrink-0 px-3 py-1 text-label-sm disabled:opacity-60"
            >
              {isGenerating ? 'Starting…' : 'Generate'}
            </button>
          )}
          {idea.status === 'GENERATING' && (
            <span className="inline-flex items-center gap-1 px-3 py-1 text-label-sm text-on-surface-variant">
              <span className="material-symbols-outlined animate-spin text-[16px]">sync</span>
              Generating
            </span>
          )}
          {idea.hasArticle && (
            <Link href="/articles" className="admin-btn-secondary shrink-0 px-3 py-1 text-label-sm">
              View article
            </Link>
          )}
        </div>
      </td>
    </tr>
  );
}
