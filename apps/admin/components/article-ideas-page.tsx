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
    <section className="mx-auto max-w-6xl px-4 py-10">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Article ideas</h2>
        <p className="mt-2 text-gray-600">
          Review drafts, generate from topics, and approve for writing.
        </p>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <form
        onSubmit={handleCreate}
        className="mt-8 grid gap-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm md:grid-cols-2"
      >
        <h3 className="md:col-span-2 text-lg font-medium text-gray-900">Create idea manually</h3>
        <label className="block text-sm">
          <span className="text-gray-700">Category</span>
          <select
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
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
          <span className="text-gray-700">Title</span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Article title"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            required
            minLength={5}
          />
        </label>
        <label className="block text-sm md:col-span-2">
          <span className="text-gray-700">Summary (optional)</span>
          <textarea
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            placeholder="Brief editorial summary"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            rows={3}
          />
        </label>
        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60"
          >
            Create idea
          </button>
        </div>
      </form>

      <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-medium text-gray-900">Generate from topic</h3>
        <p className="mt-1 text-sm text-gray-500">Generate ideas from approved topics only.</p>
        {topicsQuery.isLoading && <p className="mt-4 text-sm text-gray-500">Loading topics…</p>}
        {availableTopics.length === 0 && !topicsQuery.isLoading && (
          <p className="mt-4 text-sm text-gray-500">
            No approved topics. Approve topics on the Topics page first.
          </p>
        )}
        <ul className="mt-4 divide-y divide-gray-100">
          {availableTopics.map((topic) => (
            <li key={topic.id} className="flex items-center justify-between gap-4 py-3">
              <div>
                <p className="font-medium text-gray-900">{topic.title}</p>
                <p className="text-xs text-gray-400">
                  {topic.matchedCategoryName ?? 'Uncategorized'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => fromTopicMutation.mutate(topic.id)}
                disabled={fromTopicMutation.isPending}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-60"
              >
                Generate idea
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-8 flex items-center justify-between gap-4">
        <h3 className="text-lg font-medium text-gray-900">All ideas</h3>
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
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {ideasQuery.isLoading && <p className="p-6 text-sm text-gray-500">Loading ideas…</p>}
        {ideasQuery.isError && <p className="p-6 text-sm text-red-600">Failed to load ideas.</p>}
        {ideasQuery.data && (
          <ul className="divide-y divide-gray-200">
            {ideasQuery.data.data.map((idea) => (
              <li key={idea.id} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900">{idea.title}</p>
                    {idea.summary && <p className="mt-1 text-sm text-gray-500">{idea.summary}</p>}
                    <p className="mt-2 text-xs text-gray-400">
                      {idea.categoryName ?? 'Unknown category'}
                      {idea.trendingTopicTitle ? ` · from ${idea.trendingTopicTitle}` : ''}
                      {` · ${idea.status} · ${idea.slugCandidate}`}
                    </p>
                    {idea.outline && idea.outline.length > 0 && (
                      <ul className="mt-3 list-disc pl-5 text-sm text-gray-600">
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
                          onClick={() => statusMutation.mutate({ id: idea.id, status: 'APPROVED' })}
                          className="rounded-lg bg-green-700 px-3 py-1.5 text-sm text-white hover:bg-green-800"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            statusMutation.mutate({ id: idea.id, status: 'DUPLICATE_REJECTED' })
                          }
                          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
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
                          className="rounded-lg bg-gray-900 px-3 py-1.5 text-sm text-white hover:bg-gray-800 disabled:opacity-60"
                        >
                          Generate article
                        </button>
                      )}
                    {idea.status === 'GENERATING' && (
                      <span className="text-sm text-gray-500">Generating…</span>
                    )}
                    {idea.hasArticle && (
                      <a
                        href="/articles"
                        className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
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
      </div>
    </section>
  );
}
