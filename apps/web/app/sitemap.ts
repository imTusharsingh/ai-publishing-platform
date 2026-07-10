import type { MetadataRoute } from 'next';
import { getArticles, getCategories } from '@/lib/api';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3006';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 1,
    },
  ];

  try {
    const categories = await getCategories();
    for (const category of categories.data) {
      entries.push({
        url: `${SITE_URL}/category/${category.slug}`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.8,
      });
    }

    const articles = await getArticles({ limit: 100, page: 1 });
    for (const article of articles.data) {
      entries.push({
        url: `${SITE_URL}/articles/${article.slug}`,
        lastModified: new Date(article.publishedAt),
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    }
  } catch {
    // API may be unavailable during build; return home at minimum
  }

  return entries;
}
