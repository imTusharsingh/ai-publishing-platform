import Link from 'next/link';
import type { ArticleDetail, ArticleSummary } from '@repo/shared';
import { ArticleCard } from '@/components/article-card';
import { ArticleReader } from '@/components/article-reader';
import type { CategoryLink } from '@/components/site-header';
import { PageShell } from '@/components/ui/page-shell';
import { cn } from '@/lib/cn';
import {
  countWords,
  estimateReadingMinutes,
  enrichArticleHtmlWithImages,
  extractArticleJsonLd,
  injectHeadingIds,
  isHtmlContent,
  parseImageSuggestionsFromStructuredData,
  prepareArticleHtml,
} from '@/lib/article-content';
import { formatDate } from '@/lib/format';

export function ArticleDetailView({
  article,
  relatedArticles = [],
  categories = [],
}: {
  article: ArticleDetail;
  relatedArticles?: ArticleSummary[];
  categories?: CategoryLink[];
}) {
  const htmlBody =
    article.content && isHtmlContent(article.content)
      ? enrichArticleHtmlWithImages(
          prepareArticleHtml(article.content),
          parseImageSuggestionsFromStructuredData(article.seo.structuredData),
        )
      : null;
  const wordCount = article.content ? countWords(article.content) : 0;
  const readingMinutes = estimateReadingMinutes(wordCount);
  const jsonLd = extractArticleJsonLd(article.seo.structuredData);

  return (
    <PageShell categories={categories}>
      {jsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      ) : null}
      <article className="page-container py-stack-lg">
        <nav
          className="mb-stack-md flex flex-wrap items-center gap-2 text-label-sm text-on-surface-variant"
          aria-label="Breadcrumb"
        >
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

        <header className="max-w-5xl">
          <Link
            href={`/category/${article.category.slug}`}
            className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-primary-container px-3 py-1 text-label-sm font-medium text-on-primary-container transition-colors hover:bg-primary/10"
          >
            {article.category.name}
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </Link>
          <h1 className="font-display text-display leading-tight text-on-surface">
            {article.title}
          </h1>
          {article.summary && (
            <p className="mt-4 border-l-4 border-primary pl-5 font-sans text-body-lg font-medium leading-relaxed text-on-surface">
              {article.summary}
            </p>
          )}
          <div
            className={cn(
              'flex flex-wrap items-center gap-x-4 gap-y-2 border-y border-outline-variant py-4 text-body-sm text-on-surface-variant',
              article.summary ? 'mt-5' : 'mt-6',
            )}
          >
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
                <span
                  className="material-symbols-outlined text-[18px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  robot_2
                </span>
              </div>
              <span className="text-label-md text-on-surface">{article.authorName}</span>
            </div>
            <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time>
            {wordCount > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span>{readingMinutes} min read</span>
                <span aria-hidden="true">·</span>
                <span>{wordCount.toLocaleString()} words</span>
              </>
            )}
          </div>
        </header>

        {article.featuredImageUrl && (
          <figure className="mt-6 w-full overflow-hidden rounded-2xl shadow-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={article.featuredImageUrl}
              alt=""
              className="aspect-[16/9] w-full object-cover"
            />
          </figure>
        )}

        <div className="mt-6 w-full">
          {article.content ? (
            htmlBody ? (
              <ArticleReader html={htmlBody} />
            ) : (
              <div className="max-w-4xl whitespace-pre-wrap font-sans text-body-md leading-relaxed text-on-surface">
                {article.content}
              </div>
            )
          ) : (
            <p className="text-on-surface-variant">No content available.</p>
          )}
        </div>

        {relatedArticles.length > 0 && (
          <section className="mt-stack-lg border-t border-outline-variant pt-stack-lg">
            <div className="mb-stack-md flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">
                  Keep reading
                </p>
                <h2 className="mt-1 font-display text-headline-md text-on-surface">
                  Related Articles
                </h2>
              </div>
              <Link
                href={`/category/${article.category.slug}`}
                className="inline-flex items-center gap-1 text-label-md text-primary transition-colors hover:underline"
              >
                View all {article.category.name}
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-gutter md:grid-cols-3">
              {relatedArticles.map((related) => (
                <ArticleCard key={related.id} article={related} />
              ))}
            </div>
          </section>
        )}
      </article>
    </PageShell>
  );
}
