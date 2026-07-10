import type { ArticleSeoInput, ArticleSeoResult } from './seo-types';

const MAX_TITLE = 70;
const MAX_DESCRIPTION = 160;

function trimToLength(value: string, max: number): string {
  const trimmed = value.trim();
  if (trimmed.length <= max) {
    return trimmed;
  }

  const slice = trimmed.slice(0, max - 1);
  const lastSpace = slice.lastIndexOf(' ');
  return `${(lastSpace > 40 ? slice.slice(0, lastSpace) : slice).trim()}…`;
}

function extractKeywords(title: string, categoryName: string, summary: string | null): string[] {
  const words = `${title} ${summary ?? ''} ${categoryName}`
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 3);

  return Array.from(new Set(words)).slice(0, 8);
}

export function generateSeoWithMock(input: ArticleSeoInput): ArticleSeoResult {
  const baseUrl = (input.siteBaseUrl ?? 'http://localhost:3006').replace(/\/$/, '');
  const seoTitle = trimToLength(input.title, MAX_TITLE);
  const seoDescription = trimToLength(
    input.summary?.trim() || input.contentPlain.slice(0, 240),
    MAX_DESCRIPTION,
  );
  const canonicalUrl = `${baseUrl}/articles/${input.slug}`;
  const keywords = extractKeywords(input.title, input.categoryName, input.summary);

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: seoTitle,
    description: seoDescription,
    author: {
      '@type': 'Person',
      name: input.authorName ?? 'AI Writer',
    },
    publisher: {
      '@type': 'Organization',
      name: 'AuraNews',
    },
    mainEntityOfPage: canonicalUrl,
    articleSection: input.categoryName,
    keywords: keywords.join(', '),
    ...(input.publishedAt ? { datePublished: input.publishedAt } : {}),
  };

  return {
    seoTitle,
    seoDescription,
    canonicalUrl,
    ogImageUrl: null,
    keywords,
    structuredData,
    provider: 'mock',
    model: 'mock-seo-v1',
    promptTokens: null,
    completionTokens: null,
    costUsd: null,
  };
}
