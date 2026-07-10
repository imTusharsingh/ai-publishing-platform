import Link from 'next/link';
import type { ArticleSummary } from '@repo/shared';
import { cn } from '@/lib/cn';
import { formatDate } from '@/lib/format';

export function LiveUpdatesPanel({
  articles,
  className,
}: {
  articles: ArticleSummary[];
  className?: string;
}) {
  if (articles.length === 0) return null;

  return (
    <div
      className={cn(
        'flex h-full min-h-[280px] flex-col rounded-2xl border border-outline-variant bg-surface-container-lowest p-stack-md shadow-card',
        className,
      )}
    >
      <div className="mb-stack-md shrink-0 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
            <span className="material-symbols-outlined text-[18px]">bolt</span>
          </span>
          <div>
            <p className="text-label-sm font-semibold uppercase tracking-wider text-primary">
              Live feed
            </p>
            <p className="text-body-sm text-on-surface-variant">Recently published</p>
          </div>
        </div>
      </div>
      <ul className="flex flex-1 flex-col divide-y divide-outline-variant/60">
        {articles.slice(0, 4).map((article) => (
          <li
            key={article.id}
            className="flex flex-1 flex-col justify-center py-3 first:pt-0 last:pb-0"
          >
            <div className="mb-1.5 flex items-center gap-2 text-label-sm text-on-surface-variant">
              <span className="rounded-full bg-secondary-container px-2 py-0.5 text-on-secondary-container">
                {article.category.name}
              </span>
              <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time>
            </div>
            <Link
              href={`/articles/${article.slug}`}
              className="line-clamp-2 font-display text-headline-sm leading-snug text-on-surface transition-colors hover:text-primary"
            >
              {article.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
