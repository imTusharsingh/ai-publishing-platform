import Link from 'next/link';
import type { ArticleDetail } from '@repo/shared';
import { PageShell } from '@/components/ui/page-shell';
import { Panel } from '@/components/ui/panel';
import { formatDate } from '@/lib/format';
import { isHtmlContent, prepareArticleHtml } from '@/lib/article-content';

export function ArticleDetailView({ article }: { article: ArticleDetail }) {
  const htmlBody =
    article.content && isHtmlContent(article.content) ? prepareArticleHtml(article.content) : null;

  return (
    <PageShell>
      <article className="page-container mx-auto max-w-3xl space-y-8">
        <header className="space-y-4">
          <Link
            href={`/category/${article.category.slug}`}
            className="inline-flex rounded-full bg-surface-muted px-2.5 py-1 text-xs font-medium text-content-muted transition-colors hover:text-content"
          >
            {article.category.name}
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-content sm:text-4xl">
            {article.title}
          </h1>
          {article.summary && (
            <p className="text-lg leading-relaxed text-content-muted">{article.summary}</p>
          )}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-content-subtle">
            <span>{article.authorName}</span>
            <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time>
          </div>
        </header>

        {article.featuredImageUrl && (
          <div className="overflow-hidden rounded-2xl border border-line shadow-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={article.featuredImageUrl}
              alt=""
              className="aspect-[16/9] w-full object-cover"
            />
          </div>
        )}

        <Panel>
          {article.content ? (
            htmlBody ? (
              <div className="article-content" dangerouslySetInnerHTML={{ __html: htmlBody }} />
            ) : (
              <div className="whitespace-pre-wrap text-base leading-7 text-content">
                {article.content}
              </div>
            )
          ) : (
            <p className="text-content-muted">No content available.</p>
          )}
        </Panel>

        <footer>
          <Link
            href={`/category/${article.category.slug}`}
            className="text-sm font-medium text-content-muted transition-colors hover:text-content"
          >
            ← More in {article.category.name}
          </Link>
        </footer>
      </article>
    </PageShell>
  );
}
