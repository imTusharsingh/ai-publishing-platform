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
import { Panel } from '@/components/ui/panel';
import { SectionHeader } from '@/components/ui/section-header';
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

  return (
    <PageShell categories={categoriesQuery.data?.data.map((c) => ({ name: c.name, slug: c.slug }))}>
      <div className="page-container space-y-12">
        <SectionHeader
          title={`${category.name} Articles`}
          description={
            category.description ??
            `Stories and analysis from the ${category.name.toLowerCase()} beat.`
          }
        />

        <Panel>
          <CategoryNav
            mode="link"
            categories={categoriesQuery.data?.data ?? []}
            selectedSlug={category.slug}
            isLoading={categoriesQuery.isLoading}
          />
        </Panel>

        {articlesQuery.isLoading && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-72" />
            ))}
          </div>
        )}

        {articlesQuery.isError && (
          <Alert>Unable to load articles. Make sure the API is running on port 3008.</Alert>
        )}

        {articlesQuery.data && articlesQuery.data.data.length === 0 && (
          <EmptyState
            title="No articles in this category yet"
            description="Check back soon for new stories."
          />
        )}

        {articlesQuery.data && articlesQuery.data.data.length > 0 && (
          <>
            <div className="grid gap-stack-lg md:grid-cols-2">
              {articlesQuery.data.data.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>

            <Pagination
              page={articlesQuery.data.meta.page}
              totalPages={articlesQuery.data.meta.totalPages}
              onPrevious={() => setPage((current) => Math.max(1, current - 1))}
              onNext={() => setPage((current) => current + 1)}
            />
          </>
        )}
      </div>
    </PageShell>
  );
}
