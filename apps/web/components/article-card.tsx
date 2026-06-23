import type { ArticleSummary } from '@repo/shared';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

export function ArticleCard({ article }: { article: ArticleSummary }) {
  return (
    <article className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4 h-40 rounded-md bg-gradient-to-br from-gray-100 to-gray-200" />
      <p className="text-xs font-medium uppercase tracking-wide text-indigo-600">
        {article.category.name}
      </p>
      <h3 className="mt-2 text-lg font-semibold text-gray-900">{article.title}</h3>
      <p className="mt-2 line-clamp-3 text-sm text-gray-600">{article.summary}</p>
      <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
        <span>{article.authorName}</span>
        <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time>
      </div>
    </article>
  );
}
