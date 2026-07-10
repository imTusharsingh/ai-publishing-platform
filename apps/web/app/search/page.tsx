import type { Metadata } from 'next';
import { SearchPageView } from '@/components/search-page-view';
import { getCategories } from '@/lib/api';
import { searchArticles } from '@/lib/search-api';

export const revalidate = 60;

type SearchPageProps = {
  searchParams: Promise<{ q?: string; page?: string }>;
};

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const params = await searchParams;
  const query = params.q?.trim() ?? '';

  if (!query) {
    return {
      title: 'Search Articles',
      description: 'Search published articles across all editorial categories.',
    };
  }

  return {
    title: `Search: ${query}`,
    description: `Articles matching “${query}”.`,
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = params.q?.trim() ?? '';
  const page = Number(params.page ?? '1') || 1;

  const [categoriesResponse, results] = await Promise.all([
    getCategories().catch(() => ({ data: [] as { name: string; slug: string }[] })),
    query.length > 0
      ? searchArticles({ q: query, page, limit: 12 }).catch(() => ({
          data: [],
          meta: { query, page, limit: 12, total: 0, totalPages: 1 },
        }))
      : Promise.resolve({
          data: [],
          meta: { query, page, limit: 12, total: 0, totalPages: 1 },
        }),
  ]);

  const categories = categoriesResponse.data.map((category) => ({
    name: category.name,
    slug: category.slug,
  }));

  return <SearchPageView query={query} page={page} results={results} categories={categories} />;
}
