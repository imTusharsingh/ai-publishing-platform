'use client';

import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import type { ArticleAdminDetail, ArticleAdminStatus, ArticleAdminSummary } from '@repo/shared';
import {
  AdminInsightCard,
  AdminModal,
  AdminPageBody,
  AdminPageHeader,
  AdminPageShell,
  AdminScrollCard,
  AdminStatusBadge,
} from '@/components/admin-ui';
import { getAdminArticle, listAdminArticles, updateArticleStatus } from '@/lib/articles-api';
import { ApiError } from '@/lib/api';
import { formatRelativeTime } from '@/lib/format';
import { cn } from '@/lib/cn';

const STATUS_OPTIONS: ArticleAdminStatus[] = ['DRAFT', 'PUBLISHED', 'ARCHIVED'];

const STATUS_FILTERS = [
  { id: '', label: 'All' },
  { id: 'DRAFT', label: 'Draft' },
  { id: 'PUBLISHED', label: 'Published' },
  { id: 'ARCHIVED', label: 'Archived' },
] as const;

const COUNT_STATUSES = ['', 'DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;

const PUBLIC_SITE_URL =
  process.env.NEXT_PUBLIC_PUBLIC_SITE_URL ??
  process.env.NEXT_PUBLIC_SITE_URL ??
  'http://localhost:3006';

function parseStatusFilter(value: string | null): string {
  if (!value) {
    return '';
  }
  return STATUS_OPTIONS.includes(value as ArticleAdminStatus) ? value : '';
}

function statusLabel(status: string): string {
  return STATUS_FILTERS.find((filter) => filter.id === status)?.label ?? status;
}

function resolveFeaturedImageSrc(url: string | null | undefined): string | null {
  if (!url) {
    return null;
  }
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `${PUBLIC_SITE_URL}${url.startsWith('/') ? url : `/${url}`}`;
}

export function ArticlesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusFilter = parseStatusFilter(searchParams.get('status'));
  const queryClient = useQueryClient();

  const [previewId, setPreviewId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);

  const articlesQuery = useQuery({
    queryKey: ['admin-articles', statusFilter],
    queryFn: () =>
      listAdminArticles({
        limit: 50,
        status: statusFilter || undefined,
      }),
    refetchInterval: 10000,
  });

  const countQueries = useQueries({
    queries: COUNT_STATUSES.map((status) => ({
      queryKey: ['admin-articles-count', status || 'all'],
      queryFn: () =>
        listAdminArticles({
          limit: 1,
          status: status || undefined,
        }),
    })),
  });

  const previewQuery = useQuery({
    queryKey: ['admin-article', previewId],
    queryFn: () => getAdminArticle(previewId!),
    enabled: Boolean(previewId),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-articles'] });
    queryClient.invalidateQueries({ queryKey: ['admin-articles-count'] });
    if (previewId) {
      queryClient.invalidateQueries({ queryKey: ['admin-article', previewId] });
    }
  };

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ArticleAdminStatus }) =>
      updateArticleStatus(id, { status }),
    onMutate: ({ id }) => setStatusUpdatingId(id),
    onSuccess: () => {
      setError(null);
      invalidate();
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Status update failed'),
    onSettled: () => setStatusUpdatingId(null),
  });

  const setStatusFilter = (status: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (status) {
      params.set('status', status);
    } else {
      params.delete('status');
    }
    const query = params.toString();
    router.replace(query ? `/articles?${query}` : '/articles', { scroll: false });
  };

  const articles = articlesQuery.data?.data ?? [];
  const totalCount = countQueries[0]?.data?.meta.total ?? 0;
  const draftCount = countQueries[1]?.data?.meta.total ?? 0;
  const publishedCount = countQueries[2]?.data?.meta.total ?? 0;
  const archivedCount = countQueries[3]?.data?.meta.total ?? 0;

  const openPreview = (id: string) => {
    setError(null);
    setPreviewId(id);
  };

  const closePreview = () => {
    if (!statusMutation.isPending) {
      setPreviewId(null);
    }
  };

  return (
    <AdminPageShell fillHeight={false}>
      <AdminPageHeader
        breadcrumb="Articles"
        title="Article Management"
        description="Review drafts, publish to the public site, and manage your editorial library."
        className="mb-stack-md shrink-0"
      >
        <Link href="/ideas?status=APPROVED" className="admin-btn-secondary">
          <span className="material-symbols-outlined text-[18px]">lightbulb</span>
          Ready ideas
        </Link>
      </AdminPageHeader>

      {error && <p className="mb-4 shrink-0 text-body-sm text-on-error-container">{error}</p>}

      <div className="bento-grid mb-stack-md shrink-0">
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <AdminInsightCard
            label="Total articles"
            value={String(totalCount)}
            icon="library_books"
            meta="All statuses"
            accent="primary"
          />
        </div>
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <AdminInsightCard
            label="Draft queue"
            value={String(draftCount)}
            icon="edit_note"
            meta="Awaiting publish"
            accent="tertiary"
          />
        </div>
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <AdminInsightCard
            label="Published"
            value={String(publishedCount)}
            icon="public"
            meta="Live on site"
            accent="secondary"
          />
        </div>
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <AdminInsightCard
            label="Archived"
            value={String(archivedCount)}
            icon="inventory_2"
            meta="Removed from site"
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
                  {statusFilter ? `${statusLabel(statusFilter)} articles` : 'All articles'}
                </h2>
                <p className="mt-1 text-body-sm text-on-surface-variant">
                  {articlesQuery.data?.meta.total ?? 0} matching this filter
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
          {articlesQuery.isLoading && (
            <p className="p-stack-md text-body-sm text-on-surface-variant">Loading articles…</p>
          )}
          {articlesQuery.isError && (
            <p className="p-stack-md text-body-sm text-on-error-container">
              Failed to load articles.
            </p>
          )}
          {!articlesQuery.isLoading && articles.length === 0 && (
            <div className="p-stack-lg text-center">
              <p className="text-body-md text-on-surface">No articles in this queue</p>
              <p className="mt-2 text-body-sm text-on-surface-variant">
                {statusFilter === 'DRAFT'
                  ? 'Generate articles from approved ideas to fill the draft queue.'
                  : statusFilter === 'PUBLISHED'
                    ? 'Publish draft articles to make them live on the public site.'
                    : 'Generate content from the ideas pipeline to get started.'}
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-3">
                <Link href="/ideas?status=APPROVED" className="admin-btn-primary">
                  View ready ideas
                </Link>
                <Link href="/ideas" className="admin-btn-secondary">
                  Idea pipeline
                </Link>
              </div>
            </div>
          )}
          {articles.length > 0 && (
            <table className="admin-table admin-table-sticky">
              <thead>
                <tr>
                  <th>Article</th>
                  <th>Category</th>
                  <th>Created</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {articles.map((article) => (
                  <ArticleRow
                    key={article.id}
                    article={article}
                    statusUpdatingId={statusUpdatingId}
                    onPreview={openPreview}
                    onPublish={(id) => statusMutation.mutate({ id, status: 'PUBLISHED' })}
                    onArchive={(id) => statusMutation.mutate({ id, status: 'ARCHIVED' })}
                    statusPending={statusMutation.isPending}
                  />
                ))}
              </tbody>
            </table>
          )}
        </AdminScrollCard>
      </AdminPageBody>

      <AdminModal
        open={Boolean(previewId)}
        titleId="article-preview-title"
        title={previewQuery.data?.title ?? 'Article preview'}
        description={
          previewQuery.data ? (
            <div className="flex flex-wrap items-center gap-2">
              <AdminStatusBadge status={previewQuery.data.status} />
              <span className="font-mono text-label-sm text-on-surface-variant">
                {previewQuery.data.slug}
              </span>
            </div>
          ) : undefined
        }
        onClose={closePreview}
        closeDisabled={statusMutation.isPending}
        className="max-h-[90vh] max-w-4xl overflow-y-auto"
      >
        <ArticlePreviewBody
          detail={previewQuery.data}
          isLoading={previewQuery.isLoading}
          statusUpdatingId={statusUpdatingId}
          onPublish={(id) => statusMutation.mutate({ id, status: 'PUBLISHED' })}
          onArchive={(id) => statusMutation.mutate({ id, status: 'ARCHIVED' })}
          statusPending={statusMutation.isPending}
        />
      </AdminModal>
    </AdminPageShell>
  );
}

function ArticleRow({
  article,
  statusUpdatingId,
  onPreview,
  onPublish,
  onArchive,
  statusPending,
}: {
  article: ArticleAdminSummary;
  statusUpdatingId: string | null;
  onPreview: (id: string) => void;
  onPublish: (id: string) => void;
  onArchive: (id: string) => void;
  statusPending: boolean;
}) {
  const isUpdating = statusPending && statusUpdatingId === article.id;

  return (
    <tr>
      <td className="max-w-md">
        <div className="font-display text-on-surface">{article.title}</div>
        {article.summary && (
          <p className="mt-1 line-clamp-2 text-body-sm text-on-surface-variant">
            {article.summary}
          </p>
        )}
        <p className="mt-2 font-mono text-label-sm text-on-surface-variant">{article.slug}</p>
      </td>
      <td className="whitespace-nowrap text-on-surface-variant">{article.categoryName}</td>
      <td className="whitespace-nowrap text-body-sm text-on-surface-variant">
        <div>{formatRelativeTime(article.createdAt)}</div>
        {article.publishedAt && (
          <div className="text-label-sm text-on-surface-variant/80">
            Published {formatRelativeTime(article.publishedAt)}
          </div>
        )}
      </td>
      <td>
        <AdminStatusBadge status={article.status} />
      </td>
      <td className="text-right">
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => onPreview(article.id)}
            className="admin-btn-secondary shrink-0 px-3 py-1 text-label-sm"
          >
            Preview
          </button>
          {article.status === 'DRAFT' && (
            <button
              type="button"
              onClick={() => onPublish(article.id)}
              disabled={isUpdating}
              className="admin-btn-accent shrink-0 px-3 py-1 text-label-sm disabled:opacity-60"
            >
              {isUpdating ? 'Publishing…' : 'Publish'}
            </button>
          )}
          {article.status === 'PUBLISHED' && (
            <>
              <a
                href={`${PUBLIC_SITE_URL}/articles/${article.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="admin-btn-secondary shrink-0 px-3 py-1 text-label-sm"
              >
                View live
              </a>
              <button
                type="button"
                onClick={() => onArchive(article.id)}
                disabled={isUpdating}
                className="admin-btn-secondary shrink-0 px-3 py-1 text-label-sm disabled:opacity-60"
              >
                {isUpdating ? 'Archiving…' : 'Archive'}
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

function ArticlePreviewBody({
  detail,
  isLoading,
  statusUpdatingId,
  onPublish,
  onArchive,
  statusPending,
}: {
  detail: ArticleAdminDetail | undefined;
  isLoading: boolean;
  statusUpdatingId: string | null;
  onPublish: (id: string) => void;
  onArchive: (id: string) => void;
  statusPending: boolean;
}) {
  if (isLoading) {
    return <p className="text-body-sm text-on-surface-variant">Loading preview…</p>;
  }
  if (!detail) {
    return null;
  }

  const isUpdating = statusPending && statusUpdatingId === detail.id;
  const featuredImageSrc = resolveFeaturedImageSrc(detail.featuredImageUrl);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {detail.status === 'DRAFT' && (
          <button
            type="button"
            onClick={() => onPublish(detail.id)}
            disabled={isUpdating}
            className="admin-btn-accent shrink-0 px-3 py-1.5 text-label-sm disabled:opacity-60"
          >
            {isUpdating ? 'Publishing…' : 'Publish'}
          </button>
        )}
        {detail.status === 'PUBLISHED' && (
          <>
            <a
              href={`${PUBLIC_SITE_URL}/articles/${detail.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="admin-btn-primary shrink-0 px-3 py-1.5 text-label-sm"
            >
              View live
            </a>
            <button
              type="button"
              onClick={() => onArchive(detail.id)}
              disabled={isUpdating}
              className="admin-btn-secondary shrink-0 px-3 py-1.5 text-label-sm disabled:opacity-60"
            >
              {isUpdating ? 'Archiving…' : 'Archive'}
            </button>
          </>
        )}
      </div>

      {detail.summary && (
        <p className="mb-4 text-body-sm text-on-surface-variant">{detail.summary}</p>
      )}

      {featuredImageSrc && (
        <div className="mb-4 overflow-hidden rounded-xl border border-outline-variant">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={featuredImageSrc} alt="" className="aspect-[16/9] w-full object-cover" />
        </div>
      )}

      {(detail.seoTitle || detail.seoDescription) && (
        <div className="mb-4 rounded-xl border border-outline-variant bg-surface-container-low p-4">
          <p className="text-label-sm uppercase tracking-wider text-on-surface-variant">SEO</p>
          {detail.seoTitle && (
            <p className="mt-2 text-body-sm text-on-surface">
              <span className="text-on-surface-variant">Title: </span>
              {detail.seoTitle}
            </p>
          )}
          {detail.seoDescription && (
            <p className="mt-1 text-body-sm text-on-surface">
              <span className="text-on-surface-variant">Description: </span>
              {detail.seoDescription}
            </p>
          )}
        </div>
      )}

      {Array.isArray(detail.structuredData?.imageSuggestions) &&
        detail.structuredData.imageSuggestions.length > 0 && (
          <div className="mb-4 rounded-xl border border-outline-variant bg-surface-container-low p-4">
            <p className="text-label-sm uppercase tracking-wider text-on-surface-variant">
              Image suggestions · {detail.structuredData.imageSuggestions.length}
            </p>
            <ul className="mt-3 space-y-3">
              {(detail.structuredData.imageSuggestions as Array<Record<string, string>>).map(
                (item, index) => (
                  <li key={`${item.title ?? 'image'}-${index}`} className="text-body-sm">
                    <p className="font-medium text-on-surface">{item.title}</p>
                    <p className="text-on-surface-variant">
                      {item.type} · {item.position}
                    </p>
                    <p className="mt-1 text-on-surface-variant">{item.description}</p>
                  </li>
                ),
              )}
            </ul>
          </div>
        )}

      <p className="mb-2 text-label-sm text-on-surface-variant">
        By {detail.authorName} · {formatRelativeTime(detail.createdAt)}
      </p>

      {detail.content ? (
        <div
          className="article-content border-t border-outline-variant pt-4 text-body-sm"
          dangerouslySetInnerHTML={{ __html: detail.content }}
        />
      ) : (
        <p className="text-body-sm text-on-surface-variant">No content available.</p>
      )}
    </div>
  );
}
