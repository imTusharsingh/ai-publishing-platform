'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FormEvent, useState } from 'react';
import type { CategoryAdmin, CreateCategoryRequest } from '@repo/shared';
import {
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

const emptyForm: CreateCategoryRequest = {
  name: '',
  description: '',
  keywords: [],
  priorityScore: 50,
  publishFrequency: 'DAILY',
  articlesPerCycle: 1,
  isActive: true,
};

export function CategoriesPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<CreateCategoryRequest>(emptyForm);
  const [keywordsInput, setKeywordsInput] = useState('');
  const [editing, setEditing] = useState<CategoryAdmin | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  const parseKeywords = (value: string) =>
    value
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);

  const resetForm = () => {
    setForm(emptyForm);
    setKeywordsInput('');
    setError(null);
    setEditing(null);
    setShowForm(false);
  };

  const categoriesQuery = useQuery({
    queryKey: ['admin-categories'],
    queryFn: listCategories,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-categories'] });

  const createMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      resetForm();
      invalidate();
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Create failed'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CreateCategoryRequest }) =>
      updateCategory(id, payload),
    onSuccess: () => {
      resetForm();
      invalidate();
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Update failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: invalidate,
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Delete failed'),
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const payload = {
      ...form,
      keywords: parseKeywords(keywordsInput),
      description: form.description || undefined,
    };

    if (editing) {
      updateMutation.mutate({ id: editing.id, payload });
      return;
    }

    createMutation.mutate(payload);
  };

  const startEdit = (category: CategoryAdmin) => {
    setEditing(category);
    setShowForm(true);
    setForm({
      name: category.name,
      description: category.description ?? '',
      keywords: category.keywords,
      priorityScore: category.priorityScore,
      publishFrequency: category.publishFrequency,
      articlesPerCycle: category.articlesPerCycle,
      isActive: category.isActive,
    });
    setKeywordsInput(category.keywords.join(', '));
    setError(null);
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

  return (
    <AdminPageShell>
      <AdminPageHeader
        breadcrumb="Categories"
        title="News Categories"
        description="Manage global news taxonomy, prioritize AI content harvesting, and monitor publication throughput across all vertical channels."
        titleClassName="text-on-surface"
        className="mb-stack-md shrink-0"
      >
        <button
          type="button"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="admin-btn-primary"
        >
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

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="admin-card mb-stack-md shrink-0 space-y-4 p-stack-md"
        >
          <h3 className="font-display text-headline-sm">
            {editing ? 'Edit Category' : 'Add Category'}
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            <input
              required
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="admin-input"
            />
            <input
              type="number"
              min={1}
              max={100}
              value={form.priorityScore ?? 50}
              onChange={(e) => setForm({ ...form, priorityScore: Number(e.target.value) })}
              className="admin-input"
              placeholder="Priority score"
            />
            <textarea
              placeholder="Description"
              value={form.description ?? ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="admin-input md:col-span-2"
              rows={2}
            />
            <input
              placeholder="Keywords (comma-separated)"
              value={keywordsInput}
              onChange={(e) => setKeywordsInput(e.target.value)}
              className="admin-input md:col-span-2"
            />
            <label className="flex items-center gap-2 text-body-sm text-on-surface-variant">
              <input
                type="checkbox"
                checked={form.isActive ?? true}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              />
              Active category
            </label>
          </div>
          {error && <p className="text-body-sm text-on-error-container">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="admin-btn-primary"
            >
              {editing ? 'Save changes' : 'Create category'}
            </button>
            <button type="button" onClick={resetForm} className="admin-btn-secondary">
              Cancel
            </button>
          </div>
        </form>
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
                    <td className="text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(category)}
                          className="admin-btn-secondary px-3 py-1 text-label-sm"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Delete or deactivate "${category.name}"?`)) {
                              deleteMutation.mutate(category.id);
                            }
                          }}
                          className="rounded-lg border border-error-container px-3 py-1 text-label-sm text-on-error-container hover:bg-error-container"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </AdminScrollCard>
      </AdminPageBody>
    </AdminPageShell>
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
