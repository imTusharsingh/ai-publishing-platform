'use client';

import { useQueries, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import type { AuditLogEntry } from '@repo/shared';
import {
  AdminInsightCard,
  AdminModal,
  AdminPageBody,
  AdminPageHeader,
  AdminPageShell,
  AdminScrollCard,
} from '@/components/admin-ui';
import { listAuditLogs } from '@/lib/audit-api';
import { formatRelativeTime } from '@/lib/format';
import { cn } from '@/lib/cn';

const ENTITY_FILTERS = [
  { id: '', label: 'All' },
  { id: 'category', label: 'Categories' },
  { id: 'article', label: 'Articles' },
  { id: 'article_idea', label: 'Ideas' },
] as const;

const COUNT_ENTITY_TYPES = ['', 'category', 'article', 'article_idea'] as const;

const ACTION_LABELS: Record<string, string> = {
  'category.create': 'Created category',
  'category.update': 'Updated category',
  'category.delete': 'Deleted category',
  'article.status_update': 'Updated article status',
  'article_idea.create': 'Created idea',
  'article_idea.generate_from_topic': 'Generated idea from topic',
  'article_idea.enqueue_generation': 'Started article generation',
  'article_idea.status_update': 'Updated idea status',
  'article_idea.update': 'Updated idea',
};

function parseEntityFilter(value: string | null): string {
  if (!value) {
    return '';
  }
  return ENTITY_FILTERS.some((filter) => filter.id === value) ? value : '';
}

function actionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action.replace(/[._]/g, ' ');
}

function entityLabel(entityType: string): string {
  return ENTITY_FILTERS.find((filter) => filter.id === entityType)?.label ?? entityType;
}

function entityHref(entry: AuditLogEntry): string | null {
  if (entry.entityType === 'category' && entry.entityId) {
    return '/categories';
  }
  if (entry.entityType === 'article' && entry.entityId) {
    return '/articles';
  }
  if (entry.entityType === 'article_idea' && entry.entityId) {
    return '/ideas';
  }
  return null;
}

export function AuditPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const entityFilter = parseEntityFilter(searchParams.get('entity'));
  const [detailEntry, setDetailEntry] = useState<AuditLogEntry | null>(null);

  const auditQuery = useQuery({
    queryKey: ['admin-audit', entityFilter],
    queryFn: () =>
      listAuditLogs({
        page: 1,
        limit: 50,
        entityType: entityFilter || undefined,
      }),
  });

  const countQueries = useQueries({
    queries: COUNT_ENTITY_TYPES.map((entityType) => ({
      queryKey: ['admin-audit-count', entityType || 'all'],
      queryFn: () =>
        listAuditLogs({
          page: 1,
          limit: 1,
          entityType: entityType || undefined,
        }),
    })),
  });

  const setEntityFilter = (entity: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (entity) {
      params.set('entity', entity);
    } else {
      params.delete('entity');
    }
    const query = params.toString();
    router.replace(query ? `/audit?${query}` : '/audit', { scroll: false });
  };

  const entries = auditQuery.data?.data ?? [];
  const totalCount = countQueries[0]?.data?.meta.total ?? 0;
  const categoryCount = countQueries[1]?.data?.meta.total ?? 0;
  const articleCount = countQueries[2]?.data?.meta.total ?? 0;
  const ideaCount = countQueries[3]?.data?.meta.total ?? 0;

  return (
    <AdminPageShell fillHeight={false}>
      <AdminPageHeader
        breadcrumb="Audit Log"
        title="Platform Audit"
        description="Trace admin actions across categories, ideas, and articles."
        className="mb-stack-md shrink-0"
      />

      <div className="bento-grid mb-stack-md shrink-0">
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <AdminInsightCard
            label="Total events"
            value={String(totalCount)}
            icon="history"
            meta="All recorded actions"
            accent="primary"
          />
        </div>
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <AdminInsightCard
            label="Category changes"
            value={String(categoryCount)}
            icon="category"
            meta="Create, update, delete"
            accent="tertiary"
          />
        </div>
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <AdminInsightCard
            label="Article changes"
            value={String(articleCount)}
            icon="article"
            meta="Publish and archive"
            accent="secondary"
          />
        </div>
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <AdminInsightCard
            label="Idea changes"
            value={String(ideaCount)}
            icon="lightbulb"
            meta="Pipeline activity"
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
                  {entityFilter ? `${entityLabel(entityFilter)} activity` : 'All activity'}
                </h2>
                <p className="mt-1 text-body-sm text-on-surface-variant">
                  {auditQuery.data?.meta.total ?? 0} matching events
                </p>
              </div>
              <div className="admin-filter-tabs min-w-0">
                {ENTITY_FILTERS.map((filter) => (
                  <button
                    key={filter.id || 'all'}
                    type="button"
                    onClick={() => setEntityFilter(filter.id)}
                    className={cn(
                      'admin-filter-tab',
                      entityFilter === filter.id && 'admin-filter-tab-active',
                    )}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
          }
        >
          {auditQuery.isLoading && (
            <p className="p-stack-md text-body-sm text-on-surface-variant">
              Loading audit entries…
            </p>
          )}
          {auditQuery.isError && (
            <p className="p-stack-md text-body-sm text-on-error-container">
              Failed to load audit log.
            </p>
          )}
          {!auditQuery.isLoading && entries.length === 0 && (
            <div className="p-stack-lg text-center">
              <p className="text-body-md text-on-surface">No audit events yet</p>
              <p className="mt-2 text-body-sm text-on-surface-variant">
                Admin write actions — creating categories, approving ideas, publishing articles —
                appear here.
              </p>
            </div>
          )}
          {entries.length > 0 && (
            <table className="admin-table admin-table-sticky">
              <thead>
                <tr>
                  <th>When</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th className="text-right">Details</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <AuditRow key={entry.id} entry={entry} onDetails={setDetailEntry} />
                ))}
              </tbody>
            </table>
          )}
        </AdminScrollCard>
      </AdminPageBody>

      <AdminModal
        open={Boolean(detailEntry)}
        titleId="audit-detail-title"
        title={detailEntry ? actionLabel(detailEntry.action) : 'Audit event'}
        description={detailEntry ? formatRelativeTime(detailEntry.createdAt) : undefined}
        onClose={() => setDetailEntry(null)}
        className="max-h-[90vh] max-w-2xl overflow-y-auto"
      >
        {detailEntry && <AuditDetailBody entry={detailEntry} />}
      </AdminModal>
    </AdminPageShell>
  );
}

function AuditRow({
  entry,
  onDetails,
}: {
  entry: AuditLogEntry;
  onDetails: (entry: AuditLogEntry) => void;
}) {
  const href = entityHref(entry);

  return (
    <tr>
      <td className="whitespace-nowrap text-body-sm text-on-surface-variant">
        {formatRelativeTime(entry.createdAt)}
      </td>
      <td className="text-body-sm text-on-surface">{entry.userEmail ?? 'System'}</td>
      <td>
        <div className="text-on-surface">{actionLabel(entry.action)}</div>
        <div className="font-mono text-label-sm text-on-surface-variant">{entry.action}</div>
      </td>
      <td>
        <div className="capitalize text-on-surface">{entityLabel(entry.entityType)}</div>
        {entry.entityId && href ? (
          <Link href={href} className="font-mono text-label-sm text-primary hover:underline">
            {entry.entityId.slice(0, 8)}…
          </Link>
        ) : entry.entityId ? (
          <span className="font-mono text-label-sm text-on-surface-variant">
            {entry.entityId.slice(0, 8)}…
          </span>
        ) : (
          <span className="text-on-surface-variant">—</span>
        )}
      </td>
      <td className="text-right">
        <button
          type="button"
          onClick={() => onDetails(entry)}
          className="admin-btn-secondary shrink-0 px-3 py-1 text-label-sm"
        >
          View
        </button>
      </td>
    </tr>
  );
}

function AuditDetailBody({ entry }: { entry: AuditLogEntry }) {
  return (
    <dl className="space-y-4 text-body-sm">
      <DetailRow label="User" value={entry.userEmail ?? '—'} />
      <DetailRow label="Entity type" value={entityLabel(entry.entityType)} />
      <DetailRow label="Entity ID" value={entry.entityId ?? '—'} mono />
      <DetailRow label="IP address" value={entry.ipAddress ?? '—'} />
      <DetailRow label="User agent" value={entry.userAgent ?? '—'} />
      {entry.payload && (
        <div>
          <dt className="mb-2 text-label-sm uppercase tracking-wider text-on-surface-variant">
            Payload
          </dt>
          <dd>
            <pre className="overflow-x-auto rounded-lg bg-surface-container-low p-4 font-mono text-body-sm text-on-surface">
              {JSON.stringify(entry.payload, null, 2)}
            </pre>
          </dd>
        </div>
      )}
    </dl>
  );
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-label-sm text-on-surface-variant">{label}</dt>
      <dd className={cn('mt-0.5 text-on-surface', mono && 'font-mono text-label-sm')}>{value}</dd>
    </div>
  );
}
