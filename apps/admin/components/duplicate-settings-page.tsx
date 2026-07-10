'use client';

import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import {
  AdminInsightCard,
  AdminModal,
  AdminPageBody,
  AdminPageHeader,
  AdminPageShell,
  AdminScrollCard,
} from '@/components/admin-ui';
import {
  getDuplicateSettings,
  updateDuplicateSettings,
  type DuplicateThresholdSettings,
} from '@/lib/duplicate-settings-api';
import {
  listDuplicateRejections,
  type DuplicateRejectionEntry,
} from '@/lib/duplicate-rejections-api';
import { formatRelativeTime } from '@/lib/format';
import { cn } from '@/lib/cn';

const LAYER_FILTERS = [
  { id: '', label: 'All layers' },
  { id: '1', label: 'Layer 1 · Exact' },
  { id: '2', label: 'Layer 2 · Semantic' },
  { id: '3', label: 'Layer 3 · Cluster' },
  { id: '4', label: 'Layer 4 · Canonical' },
] as const;

const COUNT_LAYERS = [undefined, 1, 2, 3, 4] as const;

const LAYER_INFO: Record<number, { title: string; description: string }> = {
  1: {
    title: 'Exact match',
    description: 'Blocks duplicate titles, slugs, or topic keys before generation.',
  },
  2: {
    title: 'Semantic similarity',
    description: 'Compares embeddings for title, summary, and body against published articles.',
  },
  3: {
    title: 'Topic cluster',
    description: 'Prevents overlapping editorial intent within the same topic neighborhood.',
  },
  4: {
    title: 'Canonical cooldown',
    description: 'Enforces reuse windows on canonical topic keys after publication.',
  },
};

const FIELDS: Array<{
  key: keyof DuplicateThresholdSettings;
  label: string;
  help: string;
  step: number;
  min: number;
  max: number;
}> = [
  {
    key: 'titleThreshold',
    label: 'Title similarity',
    help: 'Layer 2 — how closely a title embedding must match an existing article.',
    step: 0.01,
    min: 0.5,
    max: 1,
  },
  {
    key: 'summaryThreshold',
    label: 'Summary similarity',
    help: 'Layer 2 — threshold for summary embedding overlap.',
    step: 0.01,
    min: 0.5,
    max: 1,
  },
  {
    key: 'contentThreshold',
    label: 'Content similarity',
    help: 'Layer 2 — threshold for full-body embedding overlap.',
    step: 0.01,
    min: 0.5,
    max: 1,
  },
  {
    key: 'topicCooldownDays',
    label: 'Topic cooldown (days)',
    help: 'Layer 4 — days before the same canonical topic can be published again.',
    step: 1,
    min: 1,
    max: 365,
  },
  {
    key: 'clusterDistanceThreshold',
    label: 'Cluster distance',
    help: 'Layer 3 — maximum vector distance for topic cluster neighbors.',
    step: 0.01,
    min: 0.01,
    max: 1,
  },
];

function parseLayerFilter(value: string | null): number | undefined {
  if (!value) {
    return undefined;
  }
  const layer = Number(value);
  return layer >= 1 && layer <= 4 ? layer : undefined;
}

function layerLabel(layer: number): string {
  return LAYER_INFO[layer]?.title ?? `Layer ${layer}`;
}

export function DuplicateSettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const layerFilter = parseLayerFilter(searchParams.get('layer'));
  const queryClient = useQueryClient();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [detailEntry, setDetailEntry] = useState<DuplicateRejectionEntry | null>(null);
  const [draft, setDraft] = useState<DuplicateThresholdSettings | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const rejectionsQuery = useQuery({
    queryKey: ['duplicate-rejections', layerFilter],
    queryFn: () =>
      listDuplicateRejections({
        limit: 50,
        layer: layerFilter,
      }),
  });

  const countQueries = useQueries({
    queries: COUNT_LAYERS.map((layer) => ({
      queryKey: ['duplicate-rejections-count', layer ?? 'all'],
      queryFn: () =>
        listDuplicateRejections({
          limit: 1,
          layer,
        }),
    })),
  });

  const settingsQuery = useQuery({
    queryKey: ['duplicate-settings'],
    queryFn: getDuplicateSettings,
  });

  const saveMutation = useMutation({
    mutationFn: updateDuplicateSettings,
    onSuccess: (data) => {
      queryClient.setQueryData(['duplicate-settings'], data);
      setDraft(null);
      setSaveError(null);
      setSettingsOpen(false);
    },
    onError: () => setSaveError('Failed to save settings.'),
  });

  const setLayerFilter = (layer: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (layer) {
      params.set('layer', layer);
    } else {
      params.delete('layer');
    }
    const query = params.toString();
    router.replace(query ? `/duplicate-settings?${query}` : '/duplicate-settings', {
      scroll: false,
    });
  };

  const rejections = rejectionsQuery.data?.data ?? [];
  const totalCount = countQueries[0]?.data?.meta.total ?? 0;
  const layer1Count = countQueries[1]?.data?.meta.total ?? 0;
  const layer2Count = countQueries[2]?.data?.meta.total ?? 0;
  const layer3Count = countQueries[3]?.data?.meta.total ?? 0;
  const layer4Count = countQueries[4]?.data?.meta.total ?? 0;
  const currentSettings = draft ?? settingsQuery.data;

  return (
    <AdminPageShell>
      <AdminPageHeader
        breadcrumb="Duplicates"
        title="Duplicate Detection"
        description="Review blocked content and tune the four-layer similarity engine."
        className="mb-stack-md shrink-0"
      >
        <button
          type="button"
          onClick={() => {
            setSaveError(null);
            setSettingsOpen(true);
          }}
          className="admin-btn-primary"
        >
          <span className="material-symbols-outlined text-[18px]">tune</span>
          Thresholds
        </button>
      </AdminPageHeader>

      <div className="bento-grid mb-stack-md shrink-0">
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <AdminInsightCard
            label="Total blocked"
            value={String(totalCount)}
            icon="block"
            meta="All rejection events"
            accent="primary"
          />
        </div>
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <AdminInsightCard
            label="Exact match"
            value={String(layer1Count)}
            icon="title"
            meta="Layer 1"
            accent="tertiary"
          />
        </div>
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <AdminInsightCard
            label="Semantic"
            value={String(layer2Count)}
            icon="psychology"
            meta="Layer 2"
            accent="secondary"
          />
        </div>
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <AdminInsightCard
            label="Cluster & canonical"
            value={String(layer3Count + layer4Count)}
            icon="hub"
            meta={`L3 ${layer3Count} · L4 ${layer4Count}`}
            accent="primary"
          />
        </div>
      </div>

      <AdminPageBody className="min-h-0 flex-1 pb-stack-lg">
        <div className="grid min-h-0 flex-1 gap-gutter lg:grid-cols-12">
          <AdminScrollCard
            className="min-h-0 min-w-0 max-lg:max-h-80 lg:col-span-8 lg:h-full"
            header={
              <div className="flex min-w-0 flex-col gap-4 border-b border-outline-variant bg-surface-container-low px-stack-md py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="shrink-0">
                  <h2 className="font-display text-headline-sm text-on-surface">Rejection log</h2>
                  <p className="mt-1 text-body-sm text-on-surface-variant">
                    {rejectionsQuery.data?.meta.total ?? 0} blocked submissions
                  </p>
                </div>
                <div className="admin-filter-tabs min-w-0 w-full sm:flex-1">
                  {LAYER_FILTERS.map((filter) => (
                    <button
                      key={filter.id || 'all'}
                      type="button"
                      onClick={() => setLayerFilter(filter.id)}
                      className={cn(
                        'admin-filter-tab',
                        String(layerFilter ?? '') === filter.id && 'admin-filter-tab-active',
                      )}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>
            }
          >
            {rejectionsQuery.isLoading && (
              <p className="p-stack-md text-body-sm text-on-surface-variant">Loading rejections…</p>
            )}
            {rejectionsQuery.isError && (
              <p className="p-stack-md text-body-sm text-on-error-container">
                Failed to load rejection log.
              </p>
            )}
            {!rejectionsQuery.isLoading && rejections.length === 0 && (
              <div className="p-stack-lg text-center">
                <p className="text-body-md text-on-surface">No duplicate rejections</p>
                <p className="mt-2 text-body-sm text-on-surface-variant">
                  Content that fails duplicate checks during idea approval or pre-publish review
                  appears here.
                </p>
                <Link href="/ideas" className="admin-btn-secondary mt-4 inline-flex">
                  View ideas pipeline
                </Link>
              </div>
            )}
            {rejections.length > 0 && (
              <table className="admin-table admin-table-sticky">
                <thead>
                  <tr>
                    <th>Rejected title</th>
                    <th>Layer</th>
                    <th>Matched article</th>
                    <th>Score</th>
                    <th>When</th>
                    <th className="text-right">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {rejections.map((entry) => (
                    <RejectionRow key={entry.id} entry={entry} onDetails={setDetailEntry} />
                  ))}
                </tbody>
              </table>
            )}
          </AdminScrollCard>

          <AdminScrollCard
            className="min-h-0 min-w-0 max-lg:max-h-80 lg:col-span-4 lg:h-full"
            header={
              <div className="border-b border-outline-variant bg-surface-container-low px-stack-md py-4">
                <h2 className="font-display text-headline-sm text-on-surface">Detection layers</h2>
                <p className="mt-1 text-body-sm text-on-surface-variant">
                  How content is evaluated before publication
                </p>
              </div>
            }
            bodyClassName="p-stack-md"
          >
            <ul className="space-y-4">
              {Object.entries(LAYER_INFO).map(([layer, info]) => (
                <li key={layer} className="rounded-xl border border-outline-variant p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-display text-on-surface">
                      Layer {layer} · {info.title}
                    </p>
                    <span className="rounded-full bg-surface-container-high px-2 py-0.5 text-label-sm text-on-surface-variant">
                      {layer === '1'
                        ? layer1Count
                        : layer === '2'
                          ? layer2Count
                          : layer === '3'
                            ? layer3Count
                            : layer4Count}
                    </span>
                  </div>
                  <p className="mt-2 text-body-sm text-on-surface-variant">{info.description}</p>
                </li>
              ))}
            </ul>
          </AdminScrollCard>
        </div>
      </AdminPageBody>

      <AdminModal
        open={settingsOpen}
        titleId="duplicate-settings-title"
        title="Similarity thresholds"
        description="Adjust Layer 2–4 sensitivity. Layer 1 uses exact string matching."
        onClose={() => {
          if (!saveMutation.isPending) {
            setSettingsOpen(false);
            setDraft(null);
            setSaveError(null);
          }
        }}
        closeDisabled={saveMutation.isPending}
        className="max-h-[90vh] max-w-lg overflow-y-auto"
      >
        {settingsQuery.isLoading && (
          <p className="text-body-sm text-on-surface-variant">Loading settings…</p>
        )}
        {settingsQuery.isError && (
          <p className="text-body-sm text-on-error-container">Failed to load settings.</p>
        )}
        {currentSettings && (
          <form
            className="space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              saveMutation.mutate(currentSettings);
            }}
          >
            {FIELDS.map((field) => (
              <label key={field.key} className="block">
                <span className="text-label-md text-on-surface">{field.label}</span>
                <p className="mt-1 text-body-sm text-on-surface-variant">{field.help}</p>
                <input
                  type="number"
                  step={field.step}
                  min={field.min}
                  max={field.max}
                  value={currentSettings[field.key]}
                  onChange={(event) =>
                    setDraft({
                      ...currentSettings,
                      [field.key]: Number(event.target.value),
                    })
                  }
                  className="admin-input mt-2"
                />
              </label>
            ))}

            {saveError && <p className="text-body-sm text-on-error-container">{saveError}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setSettingsOpen(false);
                  setDraft(null);
                  setSaveError(null);
                }}
                className="admin-btn-secondary"
                disabled={saveMutation.isPending}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="admin-btn-primary"
                disabled={saveMutation.isPending || !draft}
              >
                {saveMutation.isPending ? 'Saving…' : 'Save thresholds'}
              </button>
            </div>
          </form>
        )}
      </AdminModal>

      <AdminModal
        open={Boolean(detailEntry)}
        titleId="rejection-detail-title"
        title={detailEntry?.rejectedTitle ?? 'Rejection details'}
        description={
          detailEntry ? (
            <span>
              {layerLabel(detailEntry.layer)} · {formatRelativeTime(detailEntry.rejectedAt)}
            </span>
          ) : undefined
        }
        onClose={() => setDetailEntry(null)}
        className="max-h-[90vh] max-w-2xl overflow-y-auto"
      >
        {detailEntry && <RejectionDetailBody entry={detailEntry} />}
      </AdminModal>
    </AdminPageShell>
  );
}

function RejectionRow({
  entry,
  onDetails,
}: {
  entry: DuplicateRejectionEntry;
  onDetails: (entry: DuplicateRejectionEntry) => void;
}) {
  return (
    <tr>
      <td className="max-w-xs">
        <div className="line-clamp-2 font-display text-on-surface">{entry.rejectedTitle}</div>
        {entry.reason && (
          <p className="mt-1 line-clamp-1 text-body-sm text-on-surface-variant">{entry.reason}</p>
        )}
      </td>
      <td>
        <span className="rounded bg-surface-container-high px-2 py-1 text-label-sm text-on-surface">
          L{entry.layer}
        </span>
        <p className="mt-1 text-label-sm text-on-surface-variant">{layerLabel(entry.layer)}</p>
      </td>
      <td className="max-w-[12rem] text-body-sm text-on-surface-variant">
        {entry.matchedArticleTitle ? (
          <>
            <div className="line-clamp-2 text-on-surface">{entry.matchedArticleTitle}</div>
            {entry.matchedArticleId && (
              <Link href="/articles" className="text-label-sm text-primary hover:underline">
                View articles
              </Link>
            )}
          </>
        ) : (
          '—'
        )}
      </td>
      <td className="whitespace-nowrap text-body-sm text-on-surface-variant">
        {entry.similarityScore !== null ? `${(entry.similarityScore * 100).toFixed(1)}%` : '—'}
      </td>
      <td className="whitespace-nowrap text-body-sm text-on-surface-variant">
        {formatRelativeTime(entry.rejectedAt)}
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

function RejectionDetailBody({ entry }: { entry: DuplicateRejectionEntry }) {
  return (
    <dl className="space-y-4 text-body-sm">
      <DetailRow label="Layer" value={`${entry.layer} · ${layerLabel(entry.layer)}`} />
      <DetailRow label="Reason" value={entry.reason ?? '—'} />
      <DetailRow
        label="Similarity score"
        value={
          entry.similarityScore !== null ? `${(entry.similarityScore * 100).toFixed(2)}%` : '—'
        }
      />
      <DetailRow label="Matched article" value={entry.matchedArticleTitle ?? '—'} />
      {entry.matchedArticleId && (
        <DetailRow label="Matched article ID" value={entry.matchedArticleId} mono />
      )}
      {entry.metadata && (
        <div>
          <dt className="mb-2 text-label-sm uppercase tracking-wider text-on-surface-variant">
            Metadata
          </dt>
          <dd>
            <pre className="overflow-x-auto rounded-lg bg-surface-container-low p-4 font-mono text-body-sm text-on-surface">
              {JSON.stringify(entry.metadata, null, 2)}
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
