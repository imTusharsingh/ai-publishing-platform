'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import type { CategoryDetail } from '@repo/shared';
import { getArticles, getCategories } from '@/lib/api';
import { ArticleCard } from '@/components/article-card';
import { CategoryNav } from '@/components/category-nav';
import { Alert } from '@/components/ui/alert';
import { EmptyState } from '@/components/ui/empty-state';
import { PageShell } from '@/components/ui/page-shell';
import { Pagination } from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';

export function CategoryPageView({ category }: { category: CategoryDetail }) {
  const [page, setPage] = useState(1);

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  const articlesQuery = useQuery({
    queryKey: ['articles', category.slug, page],
    queryFn: () => getArticles({ page, limit: 6, category: category.slug }),
  });

  const categories = categoriesQuery.data?.data ?? [];
  const categoryLinks = categories.map((c) => ({ name: c.name, slug: c.slug }));
  const articles = articlesQuery.data?.data ?? [];
  const featuredArticle = page === 1 ? articles[0] : undefined;
  const gridArticles = featuredArticle ? articles.slice(1) : articles;

  return (
    <PageShell categories={categoryLinks}>
      <div className="page-container space-y-10 py-stack-lg">
        <section className="overflow-hidden rounded-2xl border border-outline-variant bg-gradient-to-br from-surface-container-high via-surface-container-low to-primary-container/20 px-stack-md py-stack-lg md:px-stack-lg">
          <p className="text-label-sm font-semibold uppercase tracking-wider text-primary">
            Category
          </p>
          <h1 className="mt-2 font-display text-display leading-tight text-on-surface">
            {category.name} Articles
          </h1>
          <p className="mt-4 max-w-3xl text-body-md leading-relaxed text-on-surface-variant">
            {category.description ??
              `Stories and analysis from the ${category.name.toLowerCase()} beat.`}
          </p>
        </section>

        <CategoryNav
          mode="link"
          categories={categories}
          selectedSlug={category.slug}
          isLoading={categoriesQuery.isLoading}
        />

        {page === 1 && featuredArticle && !articlesQuery.isLoading && (
          <section>
            <p className="mb-4 text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">
              Top story
            </p>
            <ArticleCard article={featuredArticle} featured />
          </section>
        )}

        {articlesQuery.isLoading && (
          <div className="grid gap-6 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-72 rounded-2xl" />
            ))}
          </div>
        )}

        {articlesQuery.isError && (
          <Alert>Unable to load articles. Make sure the API is running on port 3008.</Alert>
        )}

        {articlesQuery.data && articles.length === 0 && (
          <EmptyState
            title="No articles in this category yet"
            description="Check back soon for new stories in this beat."
          />
        )}

        {gridArticles.length > 0 && (
          <>
            <div>
              <p className="mb-4 text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">
                {page === 1 ? 'More in this category' : 'Articles'}
              </p>
              <div className="grid gap-stack-lg md:grid-cols-2">
                {gridArticles.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
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
      </div>
    </PageShell>
  );
}
