'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
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

export function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [page, setPage] = useState(1);

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  const articlesQuery = useQuery({
    queryKey: ['articles', selectedCategory, page],
    queryFn: () => getArticles({ page, limit: 6, category: selectedCategory }),
  });

  const selectedCategoryName = categoriesQuery.data?.data.find(
    (category) => category.slug === selectedCategory,
  )?.name;

  const handleCategorySelect = (slug?: string) => {
    setSelectedCategory(slug);
    setPage(1);
  };

  return (
    <PageShell>
      <div className="page-container space-y-8">
        <SectionHeader
          title={selectedCategoryName ? `${selectedCategoryName} Articles` : 'Latest Articles'}
          description={
            selectedCategoryName
              ? `Stories and analysis from the ${selectedCategoryName.toLowerCase()} beat.`
              : 'AI-generated news and insights — updated daily.'
          }
        />

        <Panel>
          <CategoryNav
            categories={categoriesQuery.data?.data ?? []}
            selectedSlug={selectedCategory}
            onSelect={handleCategorySelect}
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
            description="Try another category or check back soon for new stories."
          />
        )}

        {articlesQuery.data && articlesQuery.data.data.length > 0 && (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
