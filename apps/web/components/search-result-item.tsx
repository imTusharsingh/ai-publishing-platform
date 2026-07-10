import Link from 'next/link';
import type { ArticleSearchHit } from '@repo/shared';
import { formatDate } from '@/lib/format';

export function SearchResultItem({ article }: { article: ArticleSearchHit }) {
  return (
    <article className="group rounded-2xl border border-outline-variant bg-surface-container-lowest p-stack-md transition-all hover:border-primary/20 hover:shadow-card">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2 text-label-sm text-on-surface-variant">
            <Link
              href={`/category/${article.category.slug}`}
              className="rounded-full bg-secondary-container px-2.5 py-0.5 text-on-secondary-container transition-colors hover:bg-primary/10 hover:text-primary"
            >
              {article.category.name}
            </Link>
            <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time>
          </div>
          <Link href={`/articles/${article.slug}`} className="block">
            <h2 className="font-display text-headline-sm leading-snug text-on-surface transition-colors group-hover:text-primary">
              {article.title}
            </h2>
          </Link>
          {article.summary && (
            <p className="mt-2 line-clamp-2 text-body-sm leading-relaxed text-on-surface-variant">
              {article.summary}
            </p>
          )}
        </div>
        <Link
          href={`/articles/${article.slug}`}
          className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-outline-variant text-on-surface-variant transition-all group-hover:translate-x-0.5 group-hover:border-primary/30 group-hover:text-primary"
          aria-label={`Read ${article.title}`}
        >
          <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
        </Link>
      </div>
    </article>
  );
}
