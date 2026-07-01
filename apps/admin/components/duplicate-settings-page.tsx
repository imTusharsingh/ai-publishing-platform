'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
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

const FIELDS: Array<{
  key: keyof DuplicateThresholdSettings;
  label: string;
  step: number;
  min: number;
  max: number;
}> = [
  { key: 'titleThreshold', label: 'Title similarity threshold', step: 0.01, min: 0.5, max: 1 },
  { key: 'summaryThreshold', label: 'Summary similarity threshold', step: 0.01, min: 0.5, max: 1 },
  { key: 'contentThreshold', label: 'Content similarity threshold', step: 0.01, min: 0.5, max: 1 },
  { key: 'topicCooldownDays', label: 'Topic cooldown (days)', step: 1, min: 1, max: 365 },
  {
    key: 'clusterDistanceThreshold',
    label: 'Cluster distance threshold',
    step: 0.01,
    min: 0.01,
    max: 1,
  },
];

export function DuplicateSettingsPage() {
  const queryClient = useQueryClient();
  const settingsQuery = useQuery({
    queryKey: ['duplicate-settings'],
    queryFn: getDuplicateSettings,
  });

  const [draft, setDraft] = useState<DuplicateThresholdSettings | null>(null);

  const saveMutation = useMutation({
    mutationFn: updateDuplicateSettings,
    onSuccess: (data) => {
      queryClient.setQueryData(['duplicate-settings'], data);
      setDraft(null);
    },
  });

  const current = draft ?? settingsQuery.data;

  return (
    <AdminPageShell>
      <AdminPageHeader
        breadcrumb="Duplicates"
        title="Duplicate Detection"
        description="Configure semantic similarity thresholds and topic cooldown windows."
        className="mb-stack-md shrink-0"
      />

      <AdminPageBody>
        <AdminScrollCard className="max-w-2xl p-6">
          {settingsQuery.isLoading && (
            <p className="text-body-sm text-on-surface-variant">Loading settings…</p>
          )}
          {settingsQuery.isError && (
            <p className="text-body-sm text-on-error-container">
              Failed to load duplicate settings.
            </p>
          )}
          {current && (
            <form
              className="space-y-5"
              onSubmit={(event) => {
                event.preventDefault();
                saveMutation.mutate(current);
              }}
            >
              {FIELDS.map((field) => (
                <label key={field.key} className="block">
                  <span className="mb-2 block text-label-md text-on-surface">{field.label}</span>
                  <input
                    type="number"
                    step={field.step}
                    min={field.min}
                    max={field.max}
                    value={current[field.key]}
                    onChange={(event) =>
                      setDraft({
                        ...current,
                        [field.key]: Number(event.target.value),
                      })
                    }
                    className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-body-md"
                  />
                </label>
              ))}

              <button
                type="submit"
                disabled={saveMutation.isPending || !draft}
                className="rounded-lg bg-primary px-4 py-2 text-label-md text-on-primary disabled:opacity-50"
              >
                {saveMutation.isPending ? 'Saving…' : 'Save thresholds'}
              </button>

              {saveMutation.isError && (
                <p className="text-body-sm text-on-error-container">Failed to save settings.</p>
              )}
              {saveMutation.isSuccess && !draft && (
                <p className="text-body-sm text-secondary">Settings saved.</p>
              )}
            </form>
          )}
        </AdminScrollCard>
      </AdminPageBody>
    </AdminPageShell>
  );
}
