import type { ArticleSummary } from '@repo/shared';
import { formatDate } from '@/lib/format';

export function ArticleCard({ article }: { article: ArticleSummary }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-card transition-shadow hover:shadow-panel">
      <div className="h-44 bg-gradient-to-br from-slate-100 via-surface-muted to-slate-200" />
      <div className="flex flex-1 flex-col p-5">
        <span className="inline-flex w-fit rounded-full bg-surface-muted px-2.5 py-1 text-xs font-medium text-content-muted">
          {article.category.name}
        </span>
        <h3 className="mt-3 text-lg font-semibold leading-snug text-content transition-colors group-hover:text-content/80">
          {article.title}
        </h3>
        <p className="mt-2 line-clamp-3 flex-1 text-sm leading-6 text-content-muted">
          {article.summary}
        </p>
        <div className="mt-4 flex items-center justify-between border-t border-line pt-4 text-xs text-content-subtle">
          <span>{article.authorName}</span>
          <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time>
        </div>
      </div>
    </article>
  );
}
