'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import type { ArticleAdminStatus } from '@repo/shared';
import { getAdminArticle, listAdminArticles, updateArticleStatus } from '@/lib/articles-api';
import { ApiError } from '@/lib/api';

const STATUS_OPTIONS: ArticleAdminStatus[] = ['DRAFT', 'PUBLISHED', 'ARCHIVED'];

export function ArticlesPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const articlesQuery = useQuery({
    queryKey: ['admin-articles', statusFilter],
    queryFn: () =>
      listAdminArticles({
        limit: 50,
        status: statusFilter || undefined,
      }),
    refetchInterval: 10000,
  });

  const detailQuery = useQuery({
    queryKey: ['admin-article', selectedId],
    queryFn: () => getAdminArticle(selectedId!),
    enabled: Boolean(selectedId),
  });

  const publishMutation = useMutation({
    mutationFn: (id: string) => updateArticleStatus(id, { status: 'PUBLISHED' }),
    onSuccess: () => {
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['admin-articles'] });
      queryClient.invalidateQueries({ queryKey: ['admin-article', selectedId] });
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Publish failed'),
  });

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Articles</h2>
        <p className="mt-2 text-gray-600">
          Review AI-generated drafts and publish to the public site.
        </p>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-8 flex items-center justify-between gap-4">
        <h3 className="text-lg font-medium text-gray-900">All articles</h3>
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

      <div className="mt-4 grid gap-6 lg:grid-cols-2">
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          {articlesQuery.isLoading && (
            <p className="p-6 text-sm text-gray-500">Loading articles…</p>
          )}
          {articlesQuery.isError && (
            <p className="p-6 text-sm text-red-600">Failed to load articles.</p>
          )}
          {articlesQuery.data && (
            <ul className="divide-y divide-gray-200">
              {articlesQuery.data.data.map((article) => (
                <li key={article.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(article.id)}
                    className={`w-full p-4 text-left hover:bg-gray-50 ${
                      selectedId === article.id ? 'bg-gray-50' : ''
                    }`}
                  >
                    <p className="font-medium text-gray-900">{article.title}</p>
                    <p className="mt-1 text-sm text-gray-500">{article.summary}</p>
                    <p className="mt-2 text-xs text-gray-400">
                      {article.categoryName} · {article.status} · {article.slug}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          {!selectedId && <p className="text-sm text-gray-500">Select an article to preview.</p>}
          {selectedId && detailQuery.isLoading && (
            <p className="text-sm text-gray-500">Loading preview…</p>
          )}
          {detailQuery.data && (
            <div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{detailQuery.data.title}</h3>
                  <p className="mt-1 text-sm text-gray-500">{detailQuery.data.status}</p>
                </div>
                {detailQuery.data.status === 'DRAFT' && (
                  <button
                    type="button"
                    onClick={() => publishMutation.mutate(detailQuery.data.id)}
                    disabled={publishMutation.isPending}
                    className="rounded-lg bg-green-700 px-3 py-1.5 text-sm text-white hover:bg-green-800 disabled:opacity-60"
                  >
                    Publish
                  </button>
                )}
              </div>
              {detailQuery.data.summary && (
                <p className="mt-4 text-sm text-gray-600">{detailQuery.data.summary}</p>
              )}
              {detailQuery.data.content && (
                <div
                  className="prose prose-sm mt-6 max-w-none text-gray-800"
                  dangerouslySetInnerHTML={{ __html: detailQuery.data.content }}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
