'use client';

import { useEffect, useRef, useState } from 'react';
import type { CategoryListResponse } from '@repo/shared';
import { Pill } from '@/components/ui/pill';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/cn';

const PRIMARY_VISIBLE = 5;

interface CategoryNavProps {
  categories: CategoryListResponse['data'];
  selectedSlug?: string;
  onSelect: (slug?: string) => void;
  isLoading?: boolean;
}

export function CategoryNav({ categories, selectedSlug, onSelect, isLoading }: CategoryNavProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  if (isLoading) {
    return (
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-10 w-28 rounded-full" />
        ))}
      </div>
    );
  }

  const primaryCategories = categories.slice(0, PRIMARY_VISIBLE);
  const overflowCategories = categories.slice(PRIMARY_VISIBLE);
  const selectedOverflow = overflowCategories.find((category) => category.slug === selectedSlug);
  const hasOverflow = overflowCategories.length > 0;

  const handleSelect = (slug?: string) => {
    onSelect(slug);
    setMenuOpen(false);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-content-subtle">
        Categories
      </h2>

      <div className="flex flex-wrap gap-2">
        <Pill label="All" active={!selectedSlug} onClick={() => handleSelect(undefined)} />

        {primaryCategories.map((category) => (
          <Pill
            key={category.id}
            label={category.name}
            active={selectedSlug === category.slug}
            onClick={() => handleSelect(category.slug)}
          />
        ))}

        {hasOverflow && (
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              aria-expanded={menuOpen}
              aria-haspopup="listbox"
              onClick={() => setMenuOpen((open) => !open)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                selectedOverflow
                  ? 'border-accent bg-accent text-accent-foreground shadow-card'
                  : 'border-line bg-surface text-content-muted hover:border-content-subtle hover:bg-surface-muted hover:text-content',
              )}
            >
              {selectedOverflow ? selectedOverflow.name : 'More'}
              <span aria-hidden="true" className="text-xs">
                {menuOpen ? '▲' : '▼'}
              </span>
            </button>

            {menuOpen && (
              <ul
                role="listbox"
                className="absolute left-0 top-full z-20 mt-2 max-h-64 w-56 overflow-y-auto rounded-xl border border-line bg-surface py-1 shadow-panel"
              >
                {overflowCategories.map((category) => (
                  <li key={category.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={selectedSlug === category.slug}
                      onClick={() => handleSelect(category.slug)}
                      className={cn(
                        'block w-full px-4 py-2.5 text-left text-sm transition-colors',
                        selectedSlug === category.slug
                          ? 'bg-surface-muted font-medium text-content'
                          : 'text-content-muted hover:bg-surface-muted hover:text-content',
                      )}
                    >
                      {category.name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
