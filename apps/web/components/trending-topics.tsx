import Link from 'next/link';
import type { CategorySummary } from '@repo/shared';

export function TrendingTopics({ categories }: { categories: CategorySummary[] }) {
  const trendingTags = categories.slice(0, 7).map((c) => ({
    label: `#${c.name.replace(/\s+/g, '')}`,
    slug: c.slug,
  }));

  return (
    <aside className="lg:col-span-4">
      <div className="space-y-6">
        <h3 className="border-b border-outline-variant pb-2 font-display text-headline-sm text-on-surface">
          Trending Topics
        </h3>
        <div className="flex flex-wrap gap-2">
          {trendingTags.map((tag) => (
            <Link
              key={tag.slug}
              href={`/category/${tag.slug}`}
              className="rounded-full bg-surface-container px-4 py-2 text-label-sm text-on-surface-variant transition-colors hover:bg-surface-container-high"
            >
              {tag.label}
            </Link>
          ))}
        </div>
      </div>
    </aside>
  );
}
