import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArticleDetailView } from '@/components/article-detail-view';
import { getArticle, getCategories } from '@/lib/api';

export const revalidate = 60;

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) {
    return { title: 'Article Not Found' };
  }

  const title = article.seo.title ?? article.title;
  const description = article.seo.description ?? article.summary ?? undefined;
  const ogImage = article.seo.ogImageUrl ?? article.featuredImageUrl ?? undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      publishedTime: article.publishedAt,
      authors: [article.authorName],
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
    ...(article.seo.canonicalUrl ? { alternates: { canonical: article.seo.canonicalUrl } } : {}),
  };
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) {
    notFound();
  }

  const [categoriesResponse, relatedArticles] = await Promise.all([
    getCategories().catch(() => ({ data: [] as { name: string; slug: string }[] })),
    Promise.resolve(article.relatedArticles ?? []),
  ]);
  const categories = categoriesResponse.data.map((c) => ({ name: c.name, slug: c.slug }));

  return (
    <ArticleDetailView
      article={article}
      relatedArticles={relatedArticles}
      categories={categories}
    />
  );
}
