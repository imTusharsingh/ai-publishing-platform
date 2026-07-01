import Link from 'next/link';
import type { ArticleSummary } from '@repo/shared';
import { formatDate } from '@/lib/format';

const PLACEHOLDER_GRADIENT =
  'bg-gradient-to-br from-surface-container-high via-surface-container to-primary-container/30';

export function ArticleCard({
  article,
  featured = false,
}: {
  article: ArticleSummary;
  featured?: boolean;
}) {
  if (featured) {
    return (
      <article className="group relative cursor-pointer overflow-hidden rounded-xl bg-surface-container shadow-card transition-all duration-300 hover:shadow-panel">
        <Link href={`/articles/${article.slug}`} className="block">
          <div className="aspect-[16/9] w-full overflow-hidden">
            {article.featuredImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={article.featuredImageUrl}
                alt=""
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            ) : (
              <div className={`h-full w-full ${PLACEHOLDER_GRADIENT}`} />
            )}
          </div>
          <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/20 to-transparent p-stack-lg text-white">
            <span className="mb-stack-sm w-fit rounded-full bg-primary px-3 py-1 text-label-sm">
              Featured: {article.category.name}
            </span>
            <h2 className="mb-stack-md font-display text-headline-lg leading-tight group-hover:underline underline-offset-4 lg:text-display">
              {article.title}
            </h2>
            {article.summary && (
              <p className="hidden max-w-2xl text-body-lg text-white/80 md:block">
                {article.summary}
              </p>
            )}
          </div>
        </Link>
      </article>
    );
  }

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest transition-all hover:shadow-panel">
      <div className="relative aspect-video overflow-hidden">
        {article.featuredImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={article.featuredImageUrl}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className={`h-full w-full ${PLACEHOLDER_GRADIENT}`} />
        )}
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
      <div className="flex flex-grow flex-col p-6">
        <time className="mb-2 text-label-sm text-on-surface-variant" dateTime={article.publishedAt}>
          {formatDate(article.publishedAt)}
        </time>
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
