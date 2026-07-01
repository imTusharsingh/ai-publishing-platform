'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FormEvent, useState } from 'react';
import type { ArticleIdeaStatus } from '@repo/shared';
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
import {
  AdminPageBody,
  AdminPageHeader,
  AdminPageShell,
  AdminScrollCard,
} from '@/components/admin-ui';

const STATUS_OPTIONS: ArticleIdeaStatus[] = [
  'DRAFT',
  'APPROVED',
  'DUPLICATE_REJECTED',
  'GENERATING',
  'FAILED',
];

export function ArticleIdeasPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [error, setError] = useState<string | null>(null);

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

  const categoriesQuery = useQuery({
    queryKey: ['admin-categories'],
    queryFn: listCategories,
  });

  const topicsQuery = useQuery({
    queryKey: ['admin-topics', 'approved'],
    queryFn: () => listTopics({ status: 'APPROVED', limit: 50 }),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-article-ideas'] });
    queryClient.invalidateQueries({ queryKey: ['admin-topics'] });
    queryClient.invalidateQueries({ queryKey: ['admin-articles'] });
  };

  const createMutation = useMutation({
    mutationFn: createArticleIdea,
    onSuccess: () => {
      setTitle('');
      setSummary('');
      setError(null);
      invalidate();
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Create failed'),
  });

  const fromTopicMutation = useMutation({
    mutationFn: createArticleIdeaFromTopic,
    onSuccess: invalidate,
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Generation failed'),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ArticleIdeaStatus }) =>
      updateArticleIdeaStatus(id, { status }),
    onSuccess: invalidate,
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Status update failed'),
  });

  const generateMutation = useMutation({
    mutationFn: generateArticleFromIdea,
    onSuccess: invalidate,
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Generation failed'),
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

  const availableTopics = topicsQuery.data?.data.filter((topic) => topic.matchedCategoryId) ?? [];

  return (
    <AdminPageShell>
      <AdminPageHeader
        breadcrumb="Article Ideas"
        title="Idea Pipeline"
        description="Review drafts, generate from topics, and approve for writing."
        className="mb-stack-md shrink-0"
      />

      {error && <p className="mb-4 shrink-0 text-body-sm text-on-error-container">{error}</p>}

      <AdminPageBody className="min-h-0 gap-gutter lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div className="flex min-h-0 flex-col gap-gutter overflow-y-auto lg:max-h-full">
          <form
            onSubmit={handleCreate}
            className="admin-card grid shrink-0 gap-4 p-stack-md md:grid-cols-2"
          >
            <h3 className="font-display text-headline-sm md:col-span-2">Create idea manually</h3>
            <label className="block text-sm">
              <span className="text-on-surface-variant">Category</span>
              <select
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
                className="admin-input mt-1"
              >
                <option value="">Select category</option>
                {categoriesQuery.data?.data.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
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
            <label className="block text-sm md:col-span-2">
              <span className="text-on-surface-variant">Summary (optional)</span>
              <textarea
                value={summary}
                onChange={(event) => setSummary(event.target.value)}
                placeholder="Brief editorial summary"
                className="admin-input mt-1"
                rows={3}
              />
            </label>
            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="admin-btn-primary"
              >
                Create idea
              </button>
            </div>
          </form>

          <div className="admin-card shrink-0 p-stack-md">
            <h3 className="text-lg font-medium text-on-surface">Generate from topic</h3>
            <p className="mt-1 text-body-sm text-on-surface-variant">
              Generate ideas from approved topics only.
            </p>
            {topicsQuery.isLoading && (
              <p className="mt-4 text-body-sm text-on-surface-variant">Loading topics…</p>
            )}
            {availableTopics.length === 0 && !topicsQuery.isLoading && (
              <p className="mt-4 text-body-sm text-on-surface-variant">
                No approved topics. Approve topics on the Topics page first.
              </p>
            )}
            <ul className="mt-4 divide-y divide-outline-variant">
              {availableTopics.map((topic) => (
                <li key={topic.id} className="flex items-center justify-between gap-4 py-3">
                  <div>
                    <p className="font-medium text-on-surface">{topic.title}</p>
                    <p className="text-label-sm text-on-surface-variant">
                      {topic.matchedCategoryName ?? 'Uncategorized'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => fromTopicMutation.mutate(topic.id)}
                    disabled={fromTopicMutation.isPending}
                    className="admin-btn-secondary shrink-0 px-3 py-1.5 text-label-sm disabled:opacity-60"
                  >
                    Generate idea
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <AdminScrollCard
          header={
            <div className="flex items-center justify-between border-b border-outline-variant p-stack-md">
              <h3 className="font-display text-headline-sm">All ideas</h3>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="admin-input w-auto"
              >
                <option value="">All statuses</option>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          }
        >
          {ideasQuery.isLoading && (
            <p className="p-6 text-body-sm text-on-surface-variant">Loading ideas…</p>
          )}
          {ideasQuery.isError && (
            <p className="p-6 text-body-sm text-on-error-container">Failed to load ideas.</p>
          )}
          {ideasQuery.data && (
            <ul className="divide-y divide-outline-variant">
              {ideasQuery.data.data.map((idea) => (
                <li key={idea.id} className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-on-surface">{idea.title}</p>
                      {idea.summary && (
                        <p className="mt-1 text-body-sm text-on-surface-variant">{idea.summary}</p>
                      )}
                      <p className="mt-2 text-label-sm text-on-surface-variant">
                        {idea.categoryName ?? 'Unknown category'}
                        {idea.trendingTopicTitle ? ` · from ${idea.trendingTopicTitle}` : ''}
                        {` · ${idea.status} · ${idea.slugCandidate}`}
                      </p>
                      {idea.outline && idea.outline.length > 0 && (
                        <ul className="mt-3 list-disc pl-5 text-body-sm text-on-surface-variant">
                          {idea.outline.map((section) => (
                            <li key={section.heading}>{section.heading}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {idea.status === 'DRAFT' && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              statusMutation.mutate({ id: idea.id, status: 'APPROVED' })
                            }
                            className="rounded-lg bg-green-700 px-3 py-1.5 text-sm text-white hover:bg-green-800"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              statusMutation.mutate({ id: idea.id, status: 'DUPLICATE_REJECTED' })
                            }
                            className="admin-btn-secondary px-3 py-1.5 text-label-sm"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {(idea.status === 'APPROVED' || idea.status === 'FAILED') &&
                        !idea.hasArticle && (
                          <button
                            type="button"
                            onClick={() => generateMutation.mutate(idea.id)}
                            disabled={generateMutation.isPending}
                            className="admin-btn-primary px-3 py-1.5 text-label-sm"
                          >
                            Generate article
                          </button>
                        )}
                      {idea.status === 'GENERATING' && (
                        <span className="text-body-sm text-on-surface-variant">Generating…</span>
                      )}
                      {idea.hasArticle && (
                        <a
                          href="/articles"
                          className="admin-btn-secondary px-3 py-1.5 text-label-sm"
                        >
                          View articles
                        </a>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </AdminScrollCard>
      </AdminPageBody>
    </AdminPageShell>
  );
}
