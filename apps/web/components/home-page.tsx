'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { getArticles, getCategories } from '@/lib/api';
import { ArticleCard } from '@/components/article-card';
import { CategoryNav } from '@/components/category-nav';
import { SiteHeader } from '@/components/site-header';

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

  const handleCategorySelect = (slug?: string) => {
    setSelectedCategory(slug);
    setPage(1);
  };

  return (
    <main className="min-h-screen">
      <SiteHeader />
      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-10">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">Latest Articles</h1>
          <p className="mt-3 text-lg text-gray-600">
            AI-generated news and insights — updated daily.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
          <CategoryNav
            categories={categoriesQuery.data?.data ?? []}
            selectedSlug={selectedCategory}
            onSelect={handleCategorySelect}
          />

          <div>
            {articlesQuery.isLoading && (
              <p className="text-sm text-gray-500">Loading articles...</p>
            )}

            {articlesQuery.isError && (
              <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                Unable to load articles. Make sure the API is running on port 3008.
              </p>
            )}

            {articlesQuery.data && articlesQuery.data.data.length === 0 && (
              <p className="text-sm text-gray-500">No published articles yet.</p>
            )}

            {articlesQuery.data && articlesQuery.data.data.length > 0 && (
              <>
                <div className="grid gap-6 sm:grid-cols-2">
                  {articlesQuery.data.data.map((article) => (
                    <ArticleCard key={article.id} article={article} />
                  ))}
                </div>

                <div className="mt-8 flex items-center justify-between">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    className="rounded-md border border-gray-300 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-500">
                    Page {articlesQuery.data.meta.page} of {articlesQuery.data.meta.totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={page >= articlesQuery.data.meta.totalPages}
                    onClick={() => setPage((current) => current + 1)}
                    className="rounded-md border border-gray-300 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
