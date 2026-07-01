import Link from 'next/link';
import { PUBLIC_APP_NAME } from '@repo/shared';

type CategoryLink = { name: string; slug: string };

export function SiteFooter({ categories = [] }: { categories?: CategoryLink[] }) {
  return (
    <footer className="mt-stack-lg border-t border-outline-variant bg-surface-container-lowest">
      <div className="page-container py-stack-lg">
        <div className="mb-stack-lg grid grid-cols-1 gap-stack-lg md:grid-cols-2">
          <div className="space-y-4">
            <Link href="/" className="font-display text-headline-sm font-bold text-primary">
              {PUBLIC_APP_NAME}
            </Link>
            <p className="text-body-sm text-on-surface-variant">
              Intelligent authority for the modern era. AI-curated news with editorial precision.
            </p>
          </div>
          {categories.length > 0 && (
            <div className="flex flex-col gap-3">
              <span className="text-label-md font-bold text-on-surface">Categories</span>
              {categories.slice(0, 6).map((category) => (
                <Link
                  key={category.slug}
                  href={`/category/${category.slug}`}
                  className="text-label-sm text-on-surface-variant transition-colors hover:text-primary"
                >
                  {category.name}
                </Link>
              ))}
            </div>
          )}
        </div>
        <div className="border-t border-outline-variant pt-stack-md">
          <p className="text-body-sm text-on-surface-variant">
            &copy; {new Date().getFullYear()} {PUBLIC_APP_NAME}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
