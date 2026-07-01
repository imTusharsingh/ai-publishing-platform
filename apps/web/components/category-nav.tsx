'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { CategoryListResponse } from '@repo/shared';
import { Pill } from '@/components/ui/pill';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/cn';

const PRIMARY_VISIBLE = 5;

interface CategoryNavProps {
  categories: CategoryListResponse['data'];
  selectedSlug?: string;
  onSelect?: (slug?: string) => void;
  isLoading?: boolean;
  mode?: 'filter' | 'link';
}

export function CategoryNav({
  categories,
  selectedSlug,
  onSelect,
  isLoading,
  mode = 'filter',
}: CategoryNavProps) {
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
    onSelect?.(slug);
    setMenuOpen(false);
  };

  const categoryHref = (slug: string) => `/category/${slug}`;

  return (
    <div className="space-y-4">
      <h2 className="flex items-center gap-2 text-label-md text-primary">
        <span className="material-symbols-outlined text-[18px]">bolt</span>
        Browse Categories
      </h2>

      <div className="flex flex-wrap gap-2">
        <Pill
          label="All"
          active={!selectedSlug}
          href={mode === 'link' ? '/' : undefined}
          onClick={mode === 'filter' ? () => handleSelect(undefined) : undefined}
        />

        {primaryCategories.map((category) => (
          <Pill
            key={category.id}
            label={category.name}
            active={selectedSlug === category.slug}
            href={mode === 'link' ? categoryHref(category.slug) : undefined}
            onClick={mode === 'filter' ? () => handleSelect(category.slug) : undefined}
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
                  ? 'border-primary bg-primary text-on-primary shadow-card'
                  : 'border-outline-variant bg-surface text-on-surface-variant hover:border-primary/30 hover:bg-surface-container-low hover:text-primary',
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
                className="absolute left-0 top-full z-20 mt-2 max-h-64 w-56 overflow-y-auto rounded-xl border border-outline-variant bg-surface py-1 shadow-panel"
              >
                {overflowCategories.map((category) => (
                  <li key={category.id}>
                    {mode === 'link' ? (
                      <Link
                        href={categoryHref(category.slug)}
                        role="option"
                        aria-current={selectedSlug === category.slug ? 'page' : undefined}
                        onClick={() => setMenuOpen(false)}
                        className={cn(
                          'block w-full px-4 py-2.5 text-left text-sm transition-colors',
                          selectedSlug === category.slug
                            ? 'bg-surface-container-low font-medium text-on-surface'
                            : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface',
                        )}
                      >
                        {category.name}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        role="option"
                        aria-selected={selectedSlug === category.slug}
                        onClick={() => handleSelect(category.slug)}
                        className={cn(
                          'block w-full px-4 py-2.5 text-left text-sm transition-colors',
                          selectedSlug === category.slug
                            ? 'bg-surface-container-low font-medium text-on-surface'
                            : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface',
                        )}
                      >
                        {category.name}
                      </button>
                    )}
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
