'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import type { PromptCatalogPrompt, PromptCatalogResponse, PromptTemplateKey } from '@repo/shared';
import { AdminPageBody, AdminPageHeader, AdminPageShell } from '@/components/admin-ui';
import { listCategories } from '@/lib/categories-api';
import { ApiError } from '@/lib/api';
import {
  getPromptCatalog,
  initializePromptTemplates,
  resetPromptByKey,
  savePromptByKey,
} from '@/lib/prompt-templates-api';
import { cn } from '@/lib/cn';

function buildDraftMap(sections: PromptCatalogResponse['sections']): Record<string, string> {
  const drafts: Record<string, string> = {};
  for (const section of sections) {
    for (const prompt of section.prompts) {
      drafts[prompt.key] = prompt.effectiveBody;
    }
  }
  return drafts;
}

function PromptEditorCard({
  prompt,
  draft,
  isSaving,
  isResetting,
  onDraftChange,
  onSave,
  onReset,
}: {
  prompt: PromptCatalogPrompt;
  draft: string;
  isSaving: boolean;
  isResetting: boolean;
  onDraftChange: (value: string) => void;
  onSave: () => void;
  onReset: () => void;
}) {
  const isDirty = draft !== prompt.effectiveBody;
  const isCustomized = prompt.isCustomized || isDirty;

  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-stack-md">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-label-md font-semibold text-on-surface">{prompt.name}</h3>
            {isCustomized && (
              <span className="rounded-full bg-secondary-container px-2 py-0.5 text-label-sm text-on-secondary-container">
                Customized
              </span>
            )}
          </div>
          <p className="mt-1 text-body-sm text-on-surface-variant">{prompt.description}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={onReset}
            disabled={isResetting || isSaving}
            className="admin-btn-secondary px-3 py-1.5 text-label-sm disabled:opacity-60"
          >
            {isResetting ? 'Resetting…' : 'Reset'}
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving || isResetting || !isDirty}
            className="admin-btn-primary px-3 py-1.5 text-label-sm disabled:opacity-60"
          >
            {isSaving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      {prompt.variables.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {prompt.variables.map((variable) => (
            <code
              key={variable}
              className="rounded-full bg-surface-container-high px-2.5 py-1 text-label-sm text-on-surface-variant"
            >
              {`{{${variable}}}`}
            </code>
          ))}
        </div>
      )}

      <textarea
        value={draft}
        onChange={(event) => onDraftChange(event.target.value)}
        rows={prompt.key === 'article_writer_system' ? 16 : 10}
        spellCheck={false}
        className="admin-input min-h-[180px] w-full font-mono text-body-sm"
      />
    </div>
  );
}

export function PromptTemplatesPage() {
  const queryClient = useQueryClient();
  const [scopeCategoryId, setScopeCategoryId] = useState('');
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    'article-writing': true,
  });
  const [notice, setNotice] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [activeKey, setActiveKey] = useState<PromptTemplateKey | null>(null);

  const catalogQuery = useQuery({
    queryKey: ['admin-prompt-catalog', scopeCategoryId || 'global'],
    queryFn: () => getPromptCatalog(scopeCategoryId || null),
  });

  const categoriesQuery = useQuery({
    queryKey: ['admin-categories'],
    queryFn: listCategories,
  });

  useEffect(() => {
    if (catalogQuery.data) {
      setDrafts(buildDraftMap(catalogQuery.data.sections));
    }
  }, [catalogQuery.data]);

  const categories = categoriesQuery.data?.data ?? [];
  const sections = catalogQuery.data?.sections ?? [];

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-prompt-catalog'] });
  };

  const saveMutation = useMutation({
    mutationFn: ({ key, body }: { key: PromptTemplateKey; body: string }) =>
      savePromptByKey(key, { body, categoryId: scopeCategoryId || null }),
    onMutate: ({ key }) => {
      setActiveKey(key);
      setPageError(null);
    },
    onSuccess: () => {
      setNotice('Prompt saved.');
      invalidate();
    },
    onError: (error) =>
      setPageError(error instanceof ApiError ? error.message : 'Failed to save prompt'),
    onSettled: () => setActiveKey(null),
  });

  const resetMutation = useMutation({
    mutationFn: (key: PromptTemplateKey) => resetPromptByKey(key, scopeCategoryId || null),
    onMutate: (key) => {
      setActiveKey(key);
      setPageError(null);
    },
    onSuccess: () => {
      setNotice('Prompt reset to default.');
      invalidate();
    },
    onError: (error) =>
      setPageError(error instanceof ApiError ? error.message : 'Failed to reset prompt'),
    onSettled: () => setActiveKey(null),
  });

  const initializeMutation = useMutation({
    mutationFn: initializePromptTemplates,
    onSuccess: () => {
      setNotice('Default prompts saved to the database.');
      invalidate();
    },
    onError: (error) =>
      setPageError(error instanceof ApiError ? error.message : 'Failed to initialize prompts'),
  });

  const scopeLabel = useMemo(() => {
    if (!scopeCategoryId) {
      return 'Global default';
    }
    return categories.find((category) => category.id === scopeCategoryId)?.name ?? 'Category';
  }, [categories, scopeCategoryId]);

  const toggleSection = (sectionId: string) => {
    setOpenSections((current) => ({ ...current, [sectionId]: !current[sectionId] }));
  };

  return (
    <AdminPageShell fillHeight={false}>
      <AdminPageHeader
        breadcrumb="Prompt templates"
        title="AI prompt configuration"
        description="Every pipeline prompt is editable here. Defaults are pre-filled — save changes to persist them, or reset any prompt back to the built-in default."
        className="mb-stack-md shrink-0"
      />

      {notice && <p className="mb-4 text-body-sm text-secondary">{notice}</p>}
      {pageError && <p className="mb-4 text-body-sm text-on-error-container">{pageError}</p>}

      <div className="mb-stack-md flex flex-col gap-4 rounded-xl border border-outline-variant bg-surface-container-low p-stack-md md:flex-row md:items-end md:justify-between">
        <label className="block min-w-[220px]">
          <span className="mb-1 block text-label-sm text-on-surface-variant">Scope</span>
          <select
            value={scopeCategoryId}
            onChange={(event) => setScopeCategoryId(event.target.value)}
            className="admin-input w-full"
          >
            <option value="">Global default</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <p className="mt-2 text-body-sm text-on-surface-variant">
            Editing prompts for <span className="font-medium text-on-surface">{scopeLabel}</span>.
            Category overrides take precedence over global defaults.
          </p>
        </label>

        <button
          type="button"
          onClick={() => initializeMutation.mutate()}
          disabled={initializeMutation.isPending}
          className="admin-btn-secondary shrink-0 px-4 py-2 text-label-sm disabled:opacity-60"
        >
          {initializeMutation.isPending ? 'Saving defaults…' : 'Save all defaults to database'}
        </button>
      </div>

      <AdminPageBody>
        {catalogQuery.isLoading ? (
          <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-stack-lg text-center">
            <span className="material-symbols-outlined inline-block animate-spin text-[28px] text-primary">
              sync
            </span>
            <p className="mt-3 text-body-sm text-on-surface-variant">
              Loading prompt configuration…
            </p>
          </div>
        ) : catalogQuery.isError ? (
          <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-stack-lg text-center">
            <p className="text-body-md text-on-surface">Could not load prompt configuration</p>
            <button
              type="button"
              onClick={() => catalogQuery.refetch()}
              className="admin-btn-secondary mt-4 px-4 py-2 text-label-sm"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {sections.map((section) => {
              const isOpen = openSections[section.id] ?? false;
              return (
                <section
                  key={section.id}
                  className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest"
                >
                  <button
                    type="button"
                    onClick={() => toggleSection(section.id)}
                    className="flex w-full items-center justify-between gap-3 border-b border-outline-variant px-stack-md py-4 text-left"
                  >
                    <div>
                      <h2 className="text-title-sm font-semibold text-on-surface">
                        {section.title}
                      </h2>
                      <p className="mt-1 text-body-sm text-on-surface-variant">
                        {section.description}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'material-symbols-outlined text-on-surface-variant transition-transform',
                        isOpen && 'rotate-180',
                      )}
                    >
                      expand_more
                    </span>
                  </button>

                  {isOpen && (
                    <div className="space-y-4 p-stack-md">
                      {section.prompts.map((prompt) => (
                        <PromptEditorCard
                          key={prompt.key}
                          prompt={prompt}
                          draft={drafts[prompt.key] ?? prompt.effectiveBody}
                          isSaving={saveMutation.isPending && activeKey === prompt.key}
                          isResetting={resetMutation.isPending && activeKey === prompt.key}
                          onDraftChange={(value) =>
                            setDrafts((current) => ({ ...current, [prompt.key]: value }))
                          }
                          onSave={() =>
                            saveMutation.mutate({
                              key: prompt.key,
                              body: drafts[prompt.key] ?? prompt.effectiveBody,
                            })
                          }
                          onReset={() => {
                            if (!prompt.dbId) {
                              setDrafts((current) => ({
                                ...current,
                                [prompt.key]: prompt.defaultBody,
                              }));
                              setNotice('Prompt restored to built-in default.');
                              return;
                            }
                            resetMutation.mutate(prompt.key);
                          }}
                        />
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </AdminPageBody>
    </AdminPageShell>
  );
}
