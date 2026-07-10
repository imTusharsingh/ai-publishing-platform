'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FormEvent, useState, type Dispatch, type SetStateAction } from 'react';
import type { CategoryAdmin, CreateCategoryRequest } from '@repo/shared';
import {
  AdminModal,
  AdminPageBody,
  AdminPageHeader,
  AdminPageShell,
  AdminScrollCard,
} from '@/components/admin-ui';
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} from '@/lib/categories-api';
import { ApiError } from '@/lib/api';
import { cn } from '@/lib/cn';
import { KeywordTagsInput } from '@/components/keyword-tags-input';

const emptyForm: CreateCategoryRequest = {
  name: '',
  description: '',
  keywords: [],
  priorityScore: 50,
  publishFrequency: 'DAILY',
  articlesPerCycle: 1,
  isActive: true,
};

type CategoryModalState = { mode: 'create' } | { mode: 'edit'; category: CategoryAdmin } | null;

export function CategoriesPage() {
  const queryClient = useQueryClient();
  const [modal, setModal] = useState<CategoryModalState>(null);
  const [form, setForm] = useState<CreateCategoryRequest>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);

  const categoriesQuery = useQuery({
    queryKey: ['admin-categories'],
    queryFn: listCategories,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-categories'] });

  const createMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      closeModal();
      invalidate();
    },
    onError: (err) => setFormError(err instanceof ApiError ? err.message : 'Create failed'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CreateCategoryRequest }) =>
      updateCategory(id, payload),
    onSuccess: () => {
      closeModal();
      invalidate();
    },
    onError: (err) => setFormError(err instanceof ApiError ? err.message : 'Update failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: (result) => {
      setPageError(null);
      setNotice(
        result.action === 'deactivated'
          ? `Category deactivated — it has ${result.articleCount} article${result.articleCount === 1 ? '' : 's'}. Delete it once inactive to remove permanently.`
          : 'Category deleted permanently.',
      );
      invalidate();
    },
    onError: (err) => {
      setNotice(null);
      setPageError(err instanceof ApiError ? err.message : 'Delete failed');
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => updateCategory(id, { isActive: false }),
    onSuccess: () => {
      setPageError(null);
      setNotice('Category marked inactive.');
      invalidate();
    },
    onError: (err) => {
      setNotice(null);
      setPageError(err instanceof ApiError ? err.message : 'Deactivate failed');
    },
  });

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const closeModal = () => {
    if (!isSaving) {
      setModal(null);
      setFormError(null);
    }
  };

  const openCreateModal = () => {
    setForm(emptyForm);
    setFormError(null);
    setModal({ mode: 'create' });
  };

  const openEditModal = (category: CategoryAdmin) => {
    setForm({
      name: category.name,
      description: category.description ?? '',
      keywords: category.keywords,
      priorityScore: category.priorityScore,
      publishFrequency: category.publishFrequency,
      articlesPerCycle: category.articlesPerCycle,
      isActive: category.isActive,
    });
    setFormError(null);
    setModal({ mode: 'edit', category });
  };

  const confirmDeactivate = (category: CategoryAdmin) => {
    const articleCount = category.articleCount ?? 0;
    if (articleCount > 0) {
      return confirm(
        `Mark "${category.name}" as inactive?\n\nIt has ${articleCount} article${articleCount === 1 ? '' : 's'} and will be hidden from publishing.`,
      );
    }
    return confirm(`Mark "${category.name}" as inactive?`);
  };

  const confirmDelete = (category: CategoryAdmin) => {
    const articleCount = category.articleCount ?? 0;

    if (articleCount > 0) {
      return confirm(
        `Permanently delete "${category.name}"?\n\nThis will also delete ${articleCount} article${articleCount === 1 ? '' : 's'}. This cannot be undone.`,
      );
    }

    return confirm(`Permanently delete "${category.name}"?`);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    const payload = {
      ...form,
      keywords: form.keywords ?? [],
      description: form.description || undefined,
    };

    if (modal?.mode === 'create') {
      createMutation.mutate(payload);
      return;
    }

    if (modal?.mode === 'edit') {
      updateMutation.mutate({ id: modal.category.id, payload });
    }
  };

  const categories =
    categoriesQuery.data?.data.filter(
      (c) =>
        !search ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.slug.toLowerCase().includes(search.toLowerCase()),
    ) ?? [];

  const avgPriority =
    categories.length > 0
      ? (categories.reduce((sum, c) => sum + c.priorityScore, 0) / categories.length).toFixed(1)
      : '—';

  const isCreate = modal?.mode === 'create';
  const isEdit = modal?.mode === 'edit';

  return (
    <AdminPageShell>
      <AdminPageHeader
        breadcrumb="Categories"
        title="News Categories"
        description="Manage global news taxonomy, prioritize AI content harvesting, and monitor publication throughput across all vertical channels."
        titleClassName="text-on-surface"
        className="mb-stack-md shrink-0"
      >
        <button type="button" onClick={openCreateModal} className="admin-btn-primary">
          <span className="material-symbols-outlined">add_circle</span>
          Add Category
        </button>
      </AdminPageHeader>

      <div className="mb-stack-md grid shrink-0 grid-cols-1 gap-gutter md:grid-cols-4">
        <Stat
          label="Total Categories"
          value={String(categoriesQuery.data?.meta.total ?? '—')}
          hint="+ active"
        />
        <Stat label="Avg Priority" value={avgPriority} hint="Across taxonomy" />
        <Stat
          label="Active Streams"
          value={String(categories.filter((c) => c.isActive).length)}
          hint="Publishing"
        />
        <Stat
          label="Inactive"
          value={String(categories.filter((c) => !c.isActive).length)}
          hint="Paused"
        />
      </div>

      {notice && <p className="mb-stack-md shrink-0 text-body-sm text-secondary">{notice}</p>}
      {pageError && (
        <p className="mb-stack-md shrink-0 text-body-sm text-on-error-container">{pageError}</p>
      )}

      <AdminPageBody>
        <AdminScrollCard
          header={
            <div className="border-b border-outline-variant p-stack-md">
              <div className="relative w-full sm:max-w-md">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
                  search
                </span>
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search categories..."
                  className="admin-input pl-10"
                />
              </div>
            </div>
          }
        >
          {categoriesQuery.isLoading && (
            <p className="p-6 text-body-sm text-on-surface-variant">Loading categories…</p>
          )}
          {categoriesQuery.isError && (
            <p className="p-6 text-body-sm text-on-error-container">Failed to load categories.</p>
          )}
          {categories.length > 0 && (
            <table className="admin-table admin-table-sticky">
              <thead>
                <tr>
                  <th>Category Name</th>
                  <th>Slug</th>
                  <th className="text-center">Priority Score</th>
                  <th>Status</th>
                  <th className="text-center">Articles</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category.id}>
                    <td>
                      <div className="font-display text-on-surface">{category.name}</div>
                      {category.description && (
                        <div className="text-body-sm text-on-surface-variant">
                          {category.description}
                        </div>
                      )}
                    </td>
                    <td className="font-mono text-body-sm text-on-surface-variant">
                      {category.slug}
                    </td>
                    <td className="text-center">
                      <span className="rounded-full bg-primary-container/20 px-3 py-1 text-label-sm text-primary">
                        {category.priorityScore}
                      </span>
                    </td>
                    <td>
                      <span
                        className={cn(
                          'rounded-full px-3 py-1 text-label-sm',
                          category.isActive
                            ? 'bg-secondary-container text-on-secondary-container'
                            : 'bg-surface-container-high text-on-surface-variant',
                        )}
                      >
                        {category.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="text-center text-body-sm text-on-surface-variant">
                      {category.articleCount ?? 0}
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(category)}
                          className="admin-btn-secondary min-w-[4.25rem] shrink-0 whitespace-nowrap px-3 py-1 text-label-sm"
                        >
                          Edit
                        </button>
                        {category.isActive ? (
                          <button
                            type="button"
                            onClick={() => {
                              if (confirmDeactivate(category)) {
                                setNotice(null);
                                deactivateMutation.mutate(category.id);
                              }
                            }}
                            disabled={deactivateMutation.isPending}
                            className="admin-btn-secondary min-w-[4.25rem] shrink-0 whitespace-nowrap px-3 py-1 text-label-sm"
                          >
                            Inactive
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              if (confirmDelete(category)) {
                                setNotice(null);
                                deleteMutation.mutate(category.id);
                              }
                            }}
                            disabled={deleteMutation.isPending}
                            className="min-w-[4.25rem] shrink-0 whitespace-nowrap rounded-lg border border-error-container px-3 py-1 text-label-sm text-on-error-container hover:bg-error-container"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </AdminScrollCard>
      </AdminPageBody>

      <AdminModal
        open={modal !== null}
        titleId="category-form-title"
        title={isCreate ? 'Add category' : 'Edit category'}
        description={
          isCreate ? (
            'Create a new taxonomy category for AI content harvesting and publishing.'
          ) : isEdit ? (
            <>
              Update taxonomy settings for{' '}
              <span className="font-medium text-on-surface">{modal.category.name}</span>.
            </>
          ) : undefined
        }
        onClose={closeModal}
        closeDisabled={isSaving}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <CategoryFields form={form} onFormChange={setForm} />
          {formError && <p className="text-body-sm text-on-error-container">{formError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={closeModal}
              className="admin-btn-secondary"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button type="submit" className="admin-btn-primary" disabled={isSaving}>
              {isSaving
                ? isCreate
                  ? 'Creating…'
                  : 'Saving…'
                : isCreate
                  ? 'Create category'
                  : 'Save changes'}
            </button>
          </div>
        </form>
      </AdminModal>
    </AdminPageShell>
  );
}

function CategoryFields({
  form,
  onFormChange,
}: {
  form: CreateCategoryRequest;
  onFormChange: Dispatch<SetStateAction<CreateCategoryRequest>>;
}) {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-label-md text-on-surface">Name</span>
          <input
            required
            value={form.name}
            onChange={(e) => onFormChange((prev) => ({ ...prev, name: e.target.value }))}
            className="admin-input"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-label-md text-on-surface">Priority score</span>
          <input
            type="number"
            min={1}
            max={100}
            value={form.priorityScore ?? 50}
            onChange={(e) =>
              onFormChange((prev) => ({ ...prev, priorityScore: Number(e.target.value) }))
            }
            className="admin-input"
          />
        </label>
      </div>
      <label className="block">
        <span className="mb-1 block text-label-md text-on-surface">Description</span>
        <textarea
          value={form.description ?? ''}
          onChange={(e) => onFormChange((prev) => ({ ...prev, description: e.target.value }))}
          className="admin-input"
          rows={3}
        />
      </label>
      <div className="block">
        <span className="mb-1 block text-label-md text-on-surface">Keywords</span>
        <KeywordTagsInput
          value={form.keywords ?? []}
          onChange={(keywords) => onFormChange((prev) => ({ ...prev, keywords }))}
        />
      </div>
      <label className="flex items-center gap-2 text-body-sm text-on-surface-variant">
        <input
          type="checkbox"
          checked={form.isActive ?? true}
          onChange={(e) => onFormChange((prev) => ({ ...prev, isActive: e.target.checked }))}
        />
        Active category
      </label>
    </>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="admin-card p-stack-md">
      <p className="mb-1 text-label-sm uppercase tracking-wider text-on-surface-variant">{label}</p>
      <div className="flex items-baseline gap-2">
        <span className="font-display text-[28px] font-bold text-on-surface">{value}</span>
        <span className="text-label-sm text-secondary">{hint}</span>
      </div>
    </div>
  );
}
