import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PageShell } from '@/components/ui/page-shell';
import { getArticles, getCategory } from '@/lib/api';

export const revalidate = 60;

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);

  if (!category) {
    return { title: 'Category Not Found' };
  }

  const title = `${category.name} — Expert Guides & Analysis`;
  const description =
    category.description ??
    `Programmatic SEO hub for ${category.name}: curated articles, trends, and expert analysis.`;

  return {
    title,
    description,
    openGraph: { title, description },
  };
}

export default async function CategoryIntroPage({ params }: PageProps) {
  const { slug } = await params;
  const category = await getCategory(slug);

  if (!category || !category.isActive) {
    notFound();
  }

  const articles = await getArticles({ category: slug, limit: 6 });

  const introParagraphs = [
    category.description ??
      `Explore authoritative ${category.name} coverage powered by AI-assisted editorial workflows.`,
    `Our ${category.name} hub aggregates timely analysis, explainers, and trend-driven reporting.`,
    category.keywords.length > 0
      ? `Key themes: ${category.keywords.slice(0, 8).join(', ')}.`
      : 'Updated regularly with fresh perspectives and data-backed insights.',
  ];

  return (
    <PageShell>
      <article className="mx-auto max-w-3xl px-gutter py-stack-xl">
        <p className="mb-2 text-label-sm uppercase tracking-wide text-primary">{category.name}</p>
        <h1 className="mb-stack-md font-display text-display-sm text-on-surface">
          {category.name} Articles &amp; Analysis
        </h1>
        {introParagraphs.map((paragraph) => (
          <p key={paragraph} className="mb-4 text-body-lg text-on-surface-variant">
            {paragraph}
          </p>
        ))}

        <section className="mt-stack-lg">
          <h2 className="mb-stack-md font-display text-headline-md text-on-surface">
            Latest in {category.name}
          </h2>
          <ul className="space-y-3">
            {articles.data.map((article) => (
              <li key={article.id}>
                <Link href={`/articles/${article.slug}`} className="text-primary hover:underline">
                  {article.title}
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href={`/category/${slug}`}
            className="mt-stack-md inline-block text-label-md text-primary hover:underline"
          >
            View all {category.name} articles →
          </Link>
        </section>
      </article>
    </PageShell>
  );
}
