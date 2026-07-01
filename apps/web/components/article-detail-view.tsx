import Link from 'next/link';
import type { ArticleDetail, ArticleSummary } from '@repo/shared';
import { ArticleCard } from '@/components/article-card';
import { PageShell } from '@/components/ui/page-shell';
import { formatDate } from '@/lib/format';
import { isHtmlContent, prepareArticleHtml } from '@/lib/article-content';

export function ArticleDetailView({
  article,
  relatedArticles = [],
}: {
  article: ArticleDetail;
  relatedArticles?: ArticleSummary[];
}) {
  const htmlBody =
    article.content && isHtmlContent(article.content) ? prepareArticleHtml(article.content) : null;

  return (
    <PageShell>
      <div className="page-container py-stack-lg">
        <nav className="mb-stack-lg flex items-center gap-2 text-label-sm text-on-surface-variant">
          <Link href="/" className="transition-colors hover:text-primary">
            Home
          </Link>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <Link
            href={`/category/${article.category.slug}`}
            className="transition-colors hover:text-primary"
          >
            {article.category.name}
          </Link>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="line-clamp-1 text-on-surface">{article.title}</span>
        </nav>

        <header className="mx-auto mb-stack-lg max-w-3xl text-center">
          <span className="mb-4 inline-block rounded-full bg-primary-container px-3 py-1 text-label-sm text-on-primary-container">
            {article.category.name.toUpperCase()}
          </span>
          <h1 className="mb-6 font-display text-display leading-tight text-on-surface">
            {article.title}
          </h1>
          <div className="flex flex-wrap items-center justify-center gap-4 text-body-sm text-on-surface-variant">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary-container text-on-secondary-fixed">
                <span
                  className="material-symbols-outlined text-sm"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  robot_2
                </span>
              </div>
              <span className="text-label-md text-on-surface">{article.authorName}</span>
            </div>
            <span className="h-1 w-1 rounded-full bg-outline-variant" />
            <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time>
          </div>
        </header>

        {article.featuredImageUrl ? (
          <div className="mb-stack-lg h-[min(600px,60vh)] overflow-hidden rounded-xl shadow-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={article.featuredImageUrl} alt="" className="h-full w-full object-cover" />
          </div>
        ) : (
          <div className="mb-stack-lg h-[min(400px,40vh)] rounded-xl bg-gradient-to-br from-surface-container-high via-surface-container to-primary-container/20 shadow-card" />
        )}

        <article className="mx-auto max-w-3xl">
          {article.summary && (
            <p className="mb-8 font-sans text-body-lg font-medium italic leading-relaxed text-on-surface">
              {article.summary}
            </p>
          )}
          {article.content ? (
            htmlBody ? (
              <div className="article-content" dangerouslySetInnerHTML={{ __html: htmlBody }} />
            ) : (
              <div className="whitespace-pre-wrap font-sans text-body-md leading-relaxed text-on-surface">
                {article.content}
              </div>
            )
          ) : (
            <p className="text-on-surface-variant">No content available.</p>
          )}
        </article>

        {relatedArticles.length > 0 && (
          <section className="mt-stack-lg pt-stack-lg">
            <div className="mb-stack-md flex items-center justify-between">
              <h3 className="font-display text-headline-md text-on-surface">Related Articles</h3>
              <Link
                href={`/category/${article.category.slug}`}
                className="text-label-md text-primary hover:underline"
              >
                View All {article.category.name}
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-gutter md:grid-cols-3">
              {relatedArticles.map((related) => (
                <ArticleCard key={related.id} article={related} />
              ))}
            </div>
          </section>
        )}
      </div>
    </PageShell>
  );
}
