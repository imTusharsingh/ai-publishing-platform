import type { ArticleSearchResponse } from '@repo/shared';
import type { CategoryLink } from '@/components/site-header';
import { SearchResultItem } from '@/components/search-result-item';
import { EmptyState } from '@/components/ui/empty-state';
import { PageShell } from '@/components/ui/page-shell';
import { PaginationLinks } from '@/components/ui/pagination-links';

function buildSearchHref(query: string, page: number) {
  const params = new URLSearchParams({ q: query });
  if (page > 1) {
    params.set('page', String(page));
  }
  return `/search?${params.toString()}`;
}

export function SearchPageView({
  query,
  page,
  results,
  categories,
}: {
  query: string;
  page: number;
  results: ArticleSearchResponse;
  categories: CategoryLink[];
}) {
  const hasQuery = query.length > 0;
  const { data, meta } = results;

  return (
    <PageShell categories={categories}>
      <div className="page-container space-y-10 py-stack-lg">
        <section className="overflow-hidden rounded-2xl border border-outline-variant bg-gradient-to-br from-surface-container-high via-surface-container-low to-primary-container/20 p-stack-md md:p-stack-lg">
          <p className="text-label-sm font-semibold uppercase tracking-wider text-primary">
            Find stories
          </p>
          <h1 className="mt-2 font-display text-display leading-tight text-on-surface">
            Search articles
          </h1>
          <p className="mt-3 max-w-2xl text-body-md text-on-surface-variant">
            Search across all published articles by title, summary, and category.
          </p>

          <form className="mt-stack-md" action="/search" method="get">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <span className="material-symbols-outlined pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[22px] text-on-surface-variant">
                  search
                </span>
                <input
                  type="search"
                  name="q"
                  defaultValue={query}
                  placeholder="Try “AI infrastructure”, “startups”, or a topic…"
                  className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest py-3 pl-12 pr-4 text-body-md text-on-surface shadow-card outline-none transition-colors placeholder:text-on-surface-variant/70 focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
                  autoFocus={!hasQuery}
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-label-md font-medium text-on-primary shadow-card transition-opacity hover:opacity-90"
              >
                <span className="material-symbols-outlined text-[20px]">search</span>
                Search
              </button>
            </div>
          </form>
        </section>

        {!hasQuery && (
          <EmptyState
            title="Start with a keyword"
            description="Enter a topic, company, or phrase above to search our published articles."
          />
        )}

        {hasQuery && data.length === 0 && (
          <EmptyState
            title={`No results for “${query}”`}
            description="Try a different keyword, check your spelling, or browse categories from the header."
          />
        )}

        {hasQuery && data.length > 0 && (
          <section className="space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-outline-variant pb-4">
              <div>
                <p className="text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">
                  Results
                </p>
                <h2 className="mt-1 font-display text-headline-md text-on-surface">
                  {meta.total === 1 ? '1 article found' : `${meta.total} articles found`}
                </h2>
              </div>
              <p className="text-body-sm text-on-surface-variant">
                Showing page {meta.page} of {meta.totalPages}
              </p>
            </div>

            <ul className="space-y-4">
              {data.map((article) => (
                <li key={article.id}>
                  <SearchResultItem article={article} />
                </li>
              ))}
            </ul>

            <PaginationLinks
              page={meta.page}
              totalPages={meta.totalPages}
              buildHref={(nextPage) => buildSearchHref(query, nextPage)}
            />
          </section>
        )}
      </div>
    </PageShell>
  );
}
