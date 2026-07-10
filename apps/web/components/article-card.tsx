import Link from 'next/link';
import type { ArticleSummary } from '@repo/shared';
import { cn } from '@/lib/cn';
import { formatDate } from '@/lib/format';

export function ArticleCard({
  article,
  featured = false,
  fillHeight = false,
}: {
  article: ArticleSummary;
  featured?: boolean;
  fillHeight?: boolean;
}) {
  const hasImage = Boolean(article.featuredImageUrl);

  if (featured) {
    return (
      <article
        className={cn(
          'group relative cursor-pointer overflow-hidden rounded-2xl bg-surface-container shadow-card transition-all duration-300 hover:shadow-panel',
          fillHeight && 'h-full w-full min-h-[280px]',
        )}
      >
        <Link href={`/articles/${article.slug}`} className={cn('block', fillHeight && 'h-full')}>
          {hasImage && (
            <div
              className={cn(
                'overflow-hidden',
                fillHeight ? 'absolute inset-0' : 'aspect-[16/9] w-full',
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={article.featuredImageUrl!}
                alt=""
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>
          )}
          <div
            className={cn(
              'flex flex-col justify-end p-stack-lg',
              hasImage
                ? fillHeight
                  ? 'relative h-full min-h-[280px] bg-gradient-to-t from-black/85 via-black/35 to-black/10 text-white'
                  : 'absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent text-white'
                : fillHeight
                  ? 'h-full min-h-[280px] bg-gradient-to-br from-primary-container via-surface-container to-surface-container-high text-on-surface'
                  : 'bg-gradient-to-br from-primary-container via-surface-container to-surface-container-high text-on-surface',
            )}
          >
            <span
              className={
                hasImage
                  ? 'mb-stack-sm w-fit rounded-full bg-primary px-3 py-1 text-label-sm'
                  : 'mb-stack-sm w-fit rounded-full bg-primary px-3 py-1 text-label-sm text-on-primary'
              }
            >
              Featured: {article.category.name}
            </span>
            <h2
              className={
                hasImage
                  ? 'mb-stack-md font-display text-headline-lg leading-tight group-hover:underline underline-offset-4 lg:text-display'
                  : 'mb-stack-md font-display text-headline-lg leading-tight text-on-surface group-hover:text-primary lg:text-display'
              }
            >
              {article.title}
            </h2>
            {article.summary && (
              <p
                className={
                  hasImage
                    ? 'hidden max-w-2xl text-body-lg text-white/80 md:block'
                    : 'hidden max-w-2xl text-body-lg text-on-surface-variant md:block'
                }
              >
                {article.summary}
              </p>
            )}
          </div>
        </Link>
      </article>
    );
  }

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-lowest transition-all hover:border-primary/20 hover:shadow-card">
      {hasImage && (
        <div className="relative aspect-video overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={article.featuredImageUrl!}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <Link
            href={`/category/${article.category.slug}`}
            className="absolute left-4 top-4 z-10 rounded bg-white/90 px-3 py-1 text-label-sm text-primary backdrop-blur-sm"
          >
            {article.category.name}
          </Link>
          <Link
            href={`/articles/${article.slug}`}
            className="absolute inset-0"
            aria-label={article.title}
          />
        </div>
      )}
      <div className="flex flex-grow flex-col p-6">
        <div className="mb-2 flex items-center justify-between gap-3">
          <time className="text-label-sm text-on-surface-variant" dateTime={article.publishedAt}>
            {formatDate(article.publishedAt)}
          </time>
          {!hasImage && (
            <Link
              href={`/category/${article.category.slug}`}
              className="rounded-full bg-surface-container-high px-3 py-1 text-label-sm text-primary"
            >
              {article.category.name}
            </Link>
          )}
        </div>
        <Link href={`/articles/${article.slug}`} className="flex flex-grow flex-col">
          <h3 className="mb-3 line-clamp-2 font-display text-headline-sm text-on-surface transition-colors group-hover:text-primary">
            {article.title}
          </h3>
          <p className="mb-6 line-clamp-3 flex-grow text-body-sm text-on-surface-variant">
            {article.summary}
          </p>
          <div className="mt-auto flex items-center justify-between border-t border-outline-variant/20 pt-4">
            <span className="text-label-sm text-on-surface-variant">{article.authorName}</span>
            <span className="material-symbols-outlined text-[18px] text-primary opacity-0 transition-opacity group-hover:opacity-100">
              arrow_forward
            </span>
          </div>
        </Link>
      </div>
    </article>
  );
}
