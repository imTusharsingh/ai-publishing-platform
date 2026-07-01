'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { getArticles, getCategories } from '@/lib/api';
import { ArticleCard } from '@/components/article-card';
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
  const articles = articlesQuery.data?.data ?? [];
  const featuredArticle = page === 1 ? articles[0] : undefined;
  const gridArticles = featuredArticle ? articles.slice(1) : articles;
  const liveUpdates = articles.slice(0, 3);

  return (
    <PageShell categories={categories.map((c) => ({ name: c.name, slug: c.slug }))}>
      <div className="page-container space-y-12">
        {page === 1 && (
          <section className="grid grid-cols-1 items-center gap-gutter lg:grid-cols-12">
            <div className="lg:col-span-7">
              {articlesQuery.isLoading && <Skeleton className="aspect-[16/9] rounded-xl" />}
              {featuredArticle && <ArticleCard article={featuredArticle} featured />}
            </div>
            <div className="space-y-6 lg:col-span-5">
              <div className="border-l-4 border-primary py-2 pl-6">
                <h2 className="mb-2 font-display text-headline-sm text-on-surface">
                  Aura Intelligence Report
                </h2>
                <p className="text-body-md text-on-surface-variant">
                  Real-time analysis of the world&apos;s most critical developments, powered by our
                  proprietary authority engine.
                </p>
              </div>
              {articlesQuery.isLoading ? (
                <Skeleton className="h-48 rounded-xl" />
              ) : (
                <LiveUpdatesPanel articles={liveUpdates} />
              )}
            </div>
          </section>
        )}

        <div className="grid grid-cols-1 gap-gutter lg:grid-cols-12">
          <div className="space-y-8 lg:col-span-8">
            <div className="flex items-end justify-between border-b border-outline-variant pb-4">
              <h2 className="font-display text-headline-md text-on-surface">Latest Articles</h2>
            </div>

            {articlesQuery.isLoading && (
              <div className="grid gap-stack-lg md:grid-cols-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-80 rounded-xl" />
                ))}
              </div>
            )}

            {articlesQuery.isError && (
              <Alert>Unable to load articles. Make sure the API is running on port 3008.</Alert>
            )}

            {articlesQuery.data && articles.length === 0 && (
              <EmptyState
                title="No articles in this category yet"
                description="Try another category or check back soon for new stories."
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
                  onPrevious={() => setPage((current) => Math.max(1, current - 1))}
                  onNext={() => setPage((current) => current + 1)}
                />
              </>
            )}
          </div>

          {!categoriesQuery.isLoading && categories.length > 0 && (
            <TrendingTopics categories={categories} />
          )}
        </div>
      </div>
    </PageShell>
  );
}
