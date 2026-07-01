import Link from 'next/link';
import { PUBLIC_APP_NAME } from '@repo/shared';

type CategoryLink = { name: string; slug: string };

export function SiteHeader({ categories = [] }: { categories?: CategoryLink[] }) {
  return (
    <header className="sticky top-0 z-50 border-b border-outline-variant bg-surface">
      <div className="page-container flex h-16 items-center justify-between">
        <div className="flex items-center gap-stack-lg">
          <Link href="/" className="font-display text-headline-md font-bold text-primary">
            {PUBLIC_APP_NAME}
          </Link>
          {categories.length > 0 && (
            <nav className="hidden items-center gap-6 md:flex">
              {categories.slice(0, 5).map((category) => (
                <Link
                  key={category.slug}
                  href={`/category/${category.slug}`}
                  className="text-label-md text-on-surface-variant transition-colors hover:text-primary"
                >
                  {category.name}
                </Link>
              ))}
            </nav>
          )}
        </div>
      </div>
    </header>
  );
}
