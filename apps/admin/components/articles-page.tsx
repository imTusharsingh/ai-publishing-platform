'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import type { ArticleAdminDetail, ArticleAdminStatus, ArticleAdminSummary } from '@repo/shared';
import {
  AdminPageBody,
  AdminPageHeader,
  AdminPageShell,
  AdminScrollCard,
  AdminStatusBadge,
} from '@/components/admin-ui';
import { getAdminArticle, listAdminArticles, updateArticleStatus } from '@/lib/articles-api';
import { ApiError } from '@/lib/api';
import { cn } from '@/lib/cn';

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

  const articles = articlesQuery.data?.data ?? [];
  const draftCount = articles.filter((a) => a.status === 'DRAFT').length;
  const publishedCount = articles.filter((a) => a.status === 'PUBLISHED').length;

  return (
    <AdminPageShell>
      <AdminPageHeader
        breadcrumb="Articles"
        title="Article Management"
        description="Review and manage AI-generated editorial content pipeline."
        className="mb-stack-md shrink-0"
      >
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="admin-input w-auto"
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </AdminPageHeader>

      {error && <p className="mb-4 shrink-0 text-body-sm text-on-error-container">{error}</p>}

      <div className="mb-stack-md grid shrink-0 grid-cols-1 gap-gutter md:grid-cols-3">
        <StatCard label="Draft queue" value={String(draftCount)} />
        <StatCard label="Published" value={String(publishedCount)} />
        <StatCard label="Loaded" value={String(articles.length)} />
      </div>

      <AdminPageBody className="min-h-0">
        <div className="grid min-h-0 flex-1 gap-gutter lg:grid-cols-[1.2fr_1fr]">
          <AdminScrollCard>
            <ArticleListContent
              articles={articles}
              selectedId={selectedId}
              onSelect={setSelectedId}
              isLoading={articlesQuery.isLoading}
              isError={articlesQuery.isError}
            />
          </AdminScrollCard>

          <AdminScrollCard bodyClassName="p-stack-md">
            <ArticlePreviewContent
              selectedId={selectedId}
              detail={detailQuery.data}
              isLoading={detailQuery.isLoading}
              onPublish={(id) => publishMutation.mutate(id)}
              isPublishing={publishMutation.isPending}
            />
          </AdminScrollCard>
        </div>
      </AdminPageBody>
    </AdminPageShell>
  );
}

function ArticleListContent({
  articles,
  selectedId,
  onSelect,
  isLoading,
  isError,
}: {
  articles: ArticleAdminSummary[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  isLoading: boolean;
  isError: boolean;
}) {
  if (isLoading) {
    return <p className="p-6 text-body-sm text-on-surface-variant">Loading articles…</p>;
  }
  if (isError) {
    return <p className="p-6 text-body-sm text-on-error-container">Failed to load articles.</p>;
  }
  if (articles.length === 0) {
    return null;
  }

  return (
    <table className="admin-table admin-table-sticky">
      <thead>
        <tr>
          <th>Title</th>
          <th>Category</th>
          <th>Status</th>
          <th>Slug</th>
        </tr>
      </thead>
      <tbody>
        {articles.map((article) => (
          <tr
            key={article.id}
            className={cn(
              'cursor-pointer',
              selectedId === article.id && 'bg-surface-container-low',
            )}
            onClick={() => onSelect(article.id)}
          >
            <td>
              <div className="font-display text-on-surface">{article.title}</div>
              {article.summary && (
                <div className="line-clamp-1 text-body-sm text-on-surface-variant">
                  {article.summary}
                </div>
              )}
            </td>
            <td className="text-on-surface-variant">{article.categoryName}</td>
            <td>
              <AdminStatusBadge status={article.status} />
            </td>
            <td className="font-mono text-body-sm text-on-surface-variant">{article.slug}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ArticlePreviewContent({
  selectedId,
  detail,
  isLoading,
  onPublish,
  isPublishing,
}: {
  selectedId: string | null;
  detail: ArticleAdminDetail | undefined;
  isLoading: boolean;
  onPublish: (id: string) => void;
  isPublishing: boolean;
}) {
  if (!selectedId) {
    return <p className="text-body-sm text-on-surface-variant">Select an article to preview.</p>;
  }
  if (isLoading) {
    return <p className="text-body-sm text-on-surface-variant">Loading preview…</p>;
  }
  if (!detail) {
    return null;
  }

  return (
    <div>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-headline-sm text-on-surface">{detail.title}</h3>
          <AdminStatusBadge status={detail.status} className="mt-2" />
        </div>
        {detail.status === 'DRAFT' && (
          <button
            type="button"
            onClick={() => onPublish(detail.id)}
            disabled={isPublishing}
            className="admin-btn-accent shrink-0 px-3 py-1.5 text-label-sm"
          >
            Publish
          </button>
        )}
      </div>
      {detail.summary && <p className="text-body-sm text-on-surface-variant">{detail.summary}</p>}
      {detail.content && (
        <div
          className="article-content mt-6 text-body-sm"
          dangerouslySetInnerHTML={{ __html: detail.content }}
        />
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="admin-card p-stack-md">
      <p className="text-label-sm uppercase tracking-wider text-on-surface-variant">{label}</p>
      <p className="mt-3 font-display text-headline-lg text-primary">{value}</p>
    </div>
  );
}
