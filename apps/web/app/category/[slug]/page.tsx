import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CategoryPageView } from '@/components/category-page-view';
import { getCategory } from '@/lib/api';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);

  if (!category) {
    return { title: 'Category Not Found' };
  }

  const title = `${category.name} Articles`;
  const description =
    category.description ?? `Latest ${category.name} articles from AI Publishing Platform.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
    },
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const category = await getCategory(slug);

  if (!category || !category.isActive) {
    notFound();
  }

  return <CategoryPageView category={category} />;
}
