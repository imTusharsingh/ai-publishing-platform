'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { getArticles, getCategories } from '@/lib/api';
import { ArticleCard } from '@/components/article-card';
import { CategoryNav } from '@/components/category-nav';
import { TrendingTopics } from '@/components/trending-topics';
import { LiveUpdatesPanel } from '@/components/live-updates-panel';
import { Alert } from '@/components/ui/alert';
import { EmptyState } from '@/components/ui/empty-state';
import { PageShell } from '@/components/ui/page-shell';
import { Pagination } from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';

export function HomePage() {
  const [page, setPage] = useState(1);

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  const articlesQuery = useQuery({
    queryKey: ['articles', page],
    queryFn: () => getArticles({ page, limit: 6 }),
  });

  const categories = categoriesQuery.data?.data ?? [];
  const categoryLinks = categories.map((c) => ({ name: c.name, slug: c.slug }));
  const articles = articlesQuery.data?.data ?? [];
  const featuredArticle = page === 1 ? articles[0] : undefined;
  const gridArticles = featuredArticle ? articles.slice(1) : articles;
  const liveUpdates = articles.slice(0, 4);
  const showSidebar = !categoriesQuery.isLoading && categories.length > 0;

  return (
    <PageShell categories={categoryLinks}>
      <div className="page-container grid grid-cols-1 gap-gutter py-stack-lg lg:grid-cols-12">
        <div className="space-y-12 lg:col-span-8">
          {page === 1 && (
            <section className="relative overflow-visible rounded-2xl border border-outline-variant bg-gradient-to-br from-primary-container/40 via-surface-container-low to-surface-container-high p-stack-md md:p-stack-lg">
              <div className="max-w-3xl">
                <p className="text-label-sm font-semibold uppercase tracking-wider text-primary">
                  Editorial intelligence
                </p>
                <h1 className="mt-2 font-display text-display leading-tight text-on-surface">
                  News and analysis, curated with authority
                </h1>
                <p className="mt-4 max-w-2xl text-body-md leading-relaxed text-on-surface-variant">
                  Long-form reporting across technology, business, and culture — discovered by AI,
                  refined for clarity, and published when it meets editorial standards.
                </p>
              </div>
              {showSidebar && (
                <div className="mt-stack-md border-t border-outline-variant/60 pt-stack-md">
                  <CategoryNav categories={categories} mode="link" isLoading={false} />
                </div>
              )}
            </section>
          )}

          {page === 1 && (
            <section className="grid grid-cols-1 gap-gutter lg:grid-cols-12 lg:items-stretch">
              <div className="flex lg:col-span-7">
                {articlesQuery.isLoading && (
                  <Skeleton className="min-h-[280px] w-full rounded-2xl lg:min-h-[420px]" />
                )}
                {featuredArticle && <ArticleCard article={featuredArticle} featured fillHeight />}
              </div>
              <div className="flex lg:col-span-5">
                {articlesQuery.isLoading ? (
                  <Skeleton className="min-h-[280px] w-full rounded-2xl lg:min-h-[420px]" />
                ) : (
                  <LiveUpdatesPanel articles={liveUpdates} className="w-full" />
                )}
              </div>
            </section>
          )}

          <section className="space-y-8">
            <div className="flex items-end justify-between gap-4 border-b border-outline-variant pb-4">
              <div>
                <p className="text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">
                  {page === 1 ? 'Fresh from the newsroom' : 'Archive'}
                </p>
                <h2 className="mt-1 font-display text-headline-md text-on-surface">
                  Latest Articles
                </h2>
              </div>
            </div>

            {articlesQuery.isLoading && (
              <div className="grid gap-stack-lg md:grid-cols-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-80 rounded-2xl" />
                ))}
              </div>
            )}

            {articlesQuery.isError && (
              <Alert>Unable to load articles. Make sure the API is running on port 3008.</Alert>
            )}

            {articlesQuery.data && articles.length === 0 && (
              <EmptyState
                title="No articles published yet"
                description="Check back soon for new stories across our editorial categories."
              />
            )}

            {gridArticles.length > 0 && (
              <>
                <div className="grid gap-stack-lg md:grid-cols-2">
                  {gridArticles.map((article) => (
                    <ArticleCard key={article.id} article={article} />
                  ))}
                </div>

                <Pagination
                  page={articlesQuery.data!.meta.page}
                  totalPages={articlesQuery.data!.meta.totalPages}
                  onPageChange={(nextPage) => {
                    setPage(nextPage);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              </>
            )}
          </section>

          {showSidebar && (
            <div className="lg:hidden">
              <TrendingTopics categories={categories} />
            </div>
          )}
        </div>

        {showSidebar && (
          <div className="hidden lg:col-span-4 lg:block">
            <TrendingTopics categories={categories} />
          </div>
        )}
      </div>
    </PageShell>
  );
}
