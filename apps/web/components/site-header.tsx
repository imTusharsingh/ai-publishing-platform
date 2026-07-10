'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { PUBLIC_APP_NAME } from '@repo/shared';
import { cn } from '@/lib/cn';

export type CategoryLink = { name: string; slug: string };

export function SiteHeader({ categories = [] }: { categories?: CategoryLink[] }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinkClass = (href: string, matchPrefix = false) =>
    cn(
      'text-label-md transition-colors',
      (matchPrefix ? pathname.startsWith(href) : pathname === href)
        ? 'font-semibold text-primary'
        : 'text-on-surface-variant hover:text-primary',
    );

  return (
    <header className="sticky top-0 z-50 border-b border-outline-variant/80 bg-surface/95 backdrop-blur-md">
      <div className="page-container flex h-16 items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-6">
          <Link href="/" className="shrink-0 font-display text-headline-md font-bold text-primary">
            {PUBLIC_APP_NAME}
          </Link>
          {categories.length > 0 && (
            <nav className="hidden items-center gap-5 lg:flex" aria-label="Primary">
              {categories.slice(0, 5).map((category) => (
                <Link
                  key={category.slug}
                  href={`/category/${category.slug}`}
                  className={navLinkClass(`/category/${category.slug}`)}
                >
                  {category.name}
                </Link>
              ))}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/search"
            className="hidden items-center gap-2 rounded-full border border-outline-variant px-4 py-2 text-label-sm text-on-surface-variant transition-colors hover:border-primary/30 hover:text-primary sm:inline-flex"
          >
            <span className="material-symbols-outlined text-[18px]">search</span>
            Search
          </Link>
          <Link
            href="/search"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-outline-variant text-on-surface-variant transition-colors hover:text-primary sm:hidden"
            aria-label="Search"
          >
            <span className="material-symbols-outlined text-[20px]">search</span>
          </Link>
          {categories.length > 0 && (
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-outline-variant text-on-surface-variant transition-colors hover:text-primary lg:hidden"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((open) => !open)}
            >
              <span className="material-symbols-outlined text-[22px]">
                {mobileOpen ? 'close' : 'menu'}
              </span>
            </button>
          )}
        </div>
      </div>

      {mobileOpen && categories.length > 0 && (
        <nav
          className="border-t border-outline-variant bg-surface px-margin-mobile py-4 lg:hidden"
          aria-label="Mobile"
        >
          <ul className="space-y-1">
            <li>
              <Link
                href="/"
                className={cn('block rounded-lg px-3 py-2.5', navLinkClass('/'))}
                onClick={() => setMobileOpen(false)}
              >
                Home
              </Link>
            </li>
            {categories.map((category) => (
              <li key={category.slug}>
                <Link
                  href={`/category/${category.slug}`}
                  className={cn(
                    'block rounded-lg px-3 py-2.5',
                    navLinkClass(`/category/${category.slug}`),
                  )}
                  onClick={() => setMobileOpen(false)}
                >
                  {category.name}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/search"
                className={cn('block rounded-lg px-3 py-2.5', navLinkClass('/search'))}
                onClick={() => setMobileOpen(false)}
              >
                Search
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
