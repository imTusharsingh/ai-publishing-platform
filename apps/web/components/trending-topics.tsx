import Link from 'next/link';
import type { CategorySummary } from '@repo/shared';

export function TrendingTopics({ categories }: { categories: CategorySummary[] }) {
  return (
    <aside className="space-y-6 lg:sticky lg:top-24">
      <div>
        <p className="text-label-sm font-semibold uppercase tracking-wider text-primary">
          Browse beats
        </p>
        <h3 className="mt-1 font-display text-headline-sm text-on-surface">Categories</h3>
      </div>
      <ul className="space-y-3">
        {categories.slice(0, 6).map((category) => (
          <li key={category.id}>
            <Link
              href={`/category/${category.slug}`}
              className="group flex items-start justify-between gap-3 rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3 transition-all hover:border-primary/30 hover:shadow-card"
            >
              <div className="min-w-0">
                <p className="font-display text-label-md text-on-surface group-hover:text-primary">
                  {category.name}
                </p>
                {category.description && (
                  <p className="mt-1 line-clamp-2 text-body-sm text-on-surface-variant">
                    {category.description}
                  </p>
                )}
              </div>
              <span className="material-symbols-outlined shrink-0 text-[18px] text-on-surface-variant transition-transform group-hover:translate-x-0.5 group-hover:text-primary">
                arrow_forward
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
