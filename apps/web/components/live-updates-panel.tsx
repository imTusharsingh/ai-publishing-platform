import Link from 'next/link';
import type { ArticleSummary } from '@repo/shared';
import { formatDate } from '@/lib/format';

export function LiveUpdatesPanel({ articles }: { articles: ArticleSummary[] }) {
  if (articles.length === 0) return null;

  return (
    <div className="rounded-xl border border-outline-variant/30 bg-surface-container-low p-6">
      <div className="mb-4 flex items-center gap-2">
        <span className="material-symbols-outlined text-primary">bolt</span>
        <span className="text-label-md text-primary">Live Updates</span>
      </div>
      <ul className="space-y-4">
        {articles.slice(0, 3).map((article, index) => (
          <li
            key={article.id}
            className={`flex flex-col gap-1 ${index < 2 ? 'border-b border-outline-variant/20 pb-4' : ''}`}
          >
            <span className="text-label-sm text-on-surface-variant">
              {formatDate(article.publishedAt)}
            </span>
            <Link
              href={`/articles/${article.slug}`}
              className="text-body-md font-semibold transition-colors hover:text-primary"
            >
              {article.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
