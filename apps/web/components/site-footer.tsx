import Link from 'next/link';
import { PUBLIC_APP_NAME } from '@repo/shared';
import type { CategoryLink } from '@/components/site-header';

export function SiteFooter({ categories = [] }: { categories?: CategoryLink[] }) {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-outline-variant bg-surface-container-low">
      <div className="page-container py-stack-lg">
        <div className="grid gap-gutter md:grid-cols-2 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-4">
            <Link href="/" className="font-display text-headline-sm font-bold text-primary">
              {PUBLIC_APP_NAME}
            </Link>
            <p className="max-w-sm text-body-sm leading-relaxed text-on-surface-variant">
              Intelligent authority for the modern era. AI-curated news and long-form analysis with
              editorial precision.
            </p>
          </div>

          <div className="lg:col-span-2">
            <h2 className="mb-4 text-label-sm font-semibold uppercase tracking-wider text-on-surface">
              Explore
            </h2>
            <ul className="space-y-2.5">
              <li>
                <Link
                  href="/"
                  className="text-body-sm text-on-surface-variant transition-colors hover:text-primary"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/search"
                  className="text-body-sm text-on-surface-variant transition-colors hover:text-primary"
                >
                  Search articles
                </Link>
              </li>
            </ul>
          </div>

          {categories.length > 0 && (
            <div className="lg:col-span-3">
              <h2 className="mb-4 text-label-sm font-semibold uppercase tracking-wider text-on-surface">
                Categories
              </h2>
              <ul className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                {categories.slice(0, 8).map((category) => (
                  <li key={category.slug}>
                    <Link
                      href={`/category/${category.slug}`}
                      className="text-body-sm text-on-surface-variant transition-colors hover:text-primary"
                    >
                      {category.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="lg:col-span-3">
            <h2 className="mb-4 text-label-sm font-semibold uppercase tracking-wider text-on-surface">
              Editorial
            </h2>
            <p className="text-body-sm leading-relaxed text-on-surface-variant">
              Stories are discovered from trending topics, reviewed in our editorial pipeline, and
              published when they meet quality standards.
            </p>
          </div>
        </div>

        <div className="mt-stack-lg flex flex-col gap-3 border-t border-outline-variant pt-stack-md sm:flex-row sm:items-center sm:justify-between">
          <p className="text-body-sm text-on-surface-variant">
            &copy; {year} {PUBLIC_APP_NAME}. All rights reserved.
          </p>
          <p className="text-label-sm text-on-surface-variant/80">
            AI-assisted publishing · Human editorial oversight
          </p>
        </div>
      </div>
    </footer>
  );
}
