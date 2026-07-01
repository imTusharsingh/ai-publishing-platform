import Link from 'next/link';
import { PageShell } from '@/components/ui/page-shell';
import { searchArticles } from '@/lib/search-api';

export const revalidate = 60;

type SearchPageProps = {
  searchParams: Promise<{ q?: string; page?: string }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = params.q?.trim() ?? '';
  const page = Number(params.page ?? '1') || 1;

  const results =
    query.length > 0
      ? await searchArticles({ q: query, page, limit: 12 }).catch(() => ({
          data: [],
          meta: { query, page, limit: 12, total: 0, totalPages: 1 },
        }))
      : { data: [], meta: { query, page, limit: 12, total: 0, totalPages: 1 } };

  return (
    <PageShell>
      <div className="mx-auto max-w-4xl px-gutter py-stack-xl">
        <h1 className="mb-stack-md font-display text-display-sm text-on-surface">Search</h1>

        <form className="mb-stack-lg flex gap-2" action="/search" method="get">
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search articles…"
            className="flex-1 rounded-lg border border-outline-variant bg-surface-container-low px-4 py-2 text-body-md text-on-surface"
          />
          <button
            type="submit"
            className="rounded-lg bg-primary px-4 py-2 text-label-md text-on-primary"
          >
            Search
          </button>
        </form>

        {query && results.data.length === 0 && (
          <p className="text-body-md text-on-surface-variant">No results for “{query}”.</p>
        )}

        <ul className="space-y-4">
          {results.data.map((article) => (
            <li key={article.id} className="rounded-xl border border-outline-variant p-stack-md">
              <Link href={`/articles/${article.slug}`} className="group">
                <h2 className="font-display text-headline-sm text-on-surface group-hover:text-primary">
                  {article.title}
                </h2>
              </Link>
              {article.summary && (
                <p className="mt-2 line-clamp-2 text-body-sm text-on-surface-variant">
                  {article.summary}
                </p>
              )}
              <p className="mt-2 text-label-sm text-on-surface-variant">
                {article.category.name} · {new Date(article.publishedAt).toLocaleDateString()}
              </p>
            </li>
          ))}
        </ul>

        {results.meta.totalPages > 1 && (
          <div className="mt-stack-lg flex justify-center gap-4">
            {page > 1 && (
              <Link
                href={`/search?q=${encodeURIComponent(query)}&page=${page - 1}`}
                className="text-primary hover:underline"
              >
                Previous
              </Link>
            )}
            {page < results.meta.totalPages && (
              <Link
                href={`/search?q=${encodeURIComponent(query)}&page=${page + 1}`}
                className="text-primary hover:underline"
              >
                Next
              </Link>
            )}
          </div>
        )}
      </div>
    </PageShell>
  );
}
