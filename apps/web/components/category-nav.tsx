'use client';

import type { CategoryListResponse } from '@repo/shared';

interface CategoryNavProps {
  categories: CategoryListResponse['data'];
  selectedSlug?: string;
  onSelect: (slug?: string) => void;
}

export function CategoryNav({ categories, selectedSlug, onSelect }: CategoryNavProps) {
  return (
    <aside className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Categories</h2>
      <ul className="mt-4 space-y-2">
        <li>
          <button
            type="button"
            onClick={() => onSelect(undefined)}
            className={`w-full rounded-md px-3 py-2 text-left text-sm ${
              !selectedSlug
                ? 'bg-indigo-50 font-medium text-indigo-700'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            All articles
          </button>
        </li>
        {categories.map((category) => (
          <li key={category.id}>
            <button
              type="button"
              onClick={() => onSelect(category.slug)}
              className={`w-full rounded-md px-3 py-2 text-left text-sm ${
                selectedSlug === category.slug
                  ? 'bg-indigo-50 font-medium text-indigo-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {category.name}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
