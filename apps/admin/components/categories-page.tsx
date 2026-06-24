'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FormEvent, useState } from 'react';
import type { CategoryAdmin, CreateCategoryRequest } from '@repo/shared';
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} from '@/lib/categories-api';
import { ApiError } from '@/lib/api';

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
  const [editing, setEditing] = useState<CategoryAdmin | null>(null);
  const [error, setError] = useState<string | null>(null);

  const categoriesQuery = useQuery({
    queryKey: ['admin-categories'],
    queryFn: listCategories,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-categories'] });

  const createMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      setForm(emptyForm);
      setError(null);
      invalidate();
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Create failed'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CreateCategoryRequest }) =>
      updateCategory(id, payload),
    onSuccess: () => {
      setEditing(null);
      setForm(emptyForm);
      setError(null);
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
      keywords: form.keywords?.filter(Boolean),
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
    setForm({
      name: category.name,
      description: category.description ?? '',
      keywords: category.keywords,
      priorityScore: category.priorityScore,
      publishFrequency: category.publishFrequency,
      articlesPerCycle: category.articlesPerCycle,
      isActive: category.isActive,
    });
    setError(null);
  };

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <h2 className="text-3xl font-bold text-gray-900">Categories</h2>
      <p className="mt-2 text-gray-600">Manage publishing categories for the platform.</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1.2fr]">
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <h3 className="text-lg font-semibold text-gray-900">
            {editing ? 'Edit category' : 'Create category'}
          </h3>

          <div className="mt-4 space-y-3">
            <input
              required
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <textarea
              placeholder="Description"
              value={form.description ?? ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              rows={3}
            />
            <input
              placeholder="Keywords (comma-separated)"
              value={(form.keywords ?? []).join(', ')}
              onChange={(e) =>
                setForm({
                  ...form,
                  keywords: e.target.value
                    .split(',')
                    .map((k) => k.trim())
                    .filter(Boolean),
                })
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <input
              type="number"
              min={1}
              max={100}
              value={form.priorityScore ?? 50}
              onChange={(e) => setForm({ ...form, priorityScore: Number(e.target.value) })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.isActive ?? true}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              />
              Active
            </label>
          </div>

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60"
            >
              {editing ? 'Save changes' : 'Create category'}
            </button>
            {editing && (
              <button
                type="button"
                onClick={() => {
                  setEditing(null);
                  setForm(emptyForm);
                  setError(null);
                }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          {categoriesQuery.isLoading && (
            <p className="p-6 text-sm text-gray-500">Loading categories…</p>
          )}
          {categoriesQuery.isError && (
            <p className="p-6 text-sm text-red-600">Failed to load categories.</p>
          )}
          {categoriesQuery.data && (
            <ul className="divide-y divide-gray-200">
              {categoriesQuery.data.data.map((category) => (
                <li key={category.id} className="flex items-start justify-between gap-4 p-4">
                  <div>
                    <p className="font-medium text-gray-900">{category.name}</p>
                    <p className="text-sm text-gray-500">{category.slug}</p>
                    <p className="mt-1 text-xs text-gray-400">
                      Priority {category.priorityScore} ·{' '}
                      {category.isActive ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(category)}
                      className="rounded border border-gray-300 px-3 py-1 text-xs"
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
                      className="rounded border border-red-200 px-3 py-1 text-xs text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
