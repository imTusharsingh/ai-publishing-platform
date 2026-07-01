import { generateSeoWithMock } from '../src/mock-seo';

describe('generateSeoWithMock', () => {
  it('builds metadata within length limits and JSON-LD', () => {
    const result = generateSeoWithMock({
      title:
        'A very long title that should be trimmed down because it exceeds the SEO title character limit for search engines',
      summary: 'Summary for readers',
      contentPlain: 'Body content for the article with enough context.',
      categoryName: 'Technology',
      slug: 'sample-article',
      authorName: 'AI Writer',
      publishedAt: '2026-01-01T00:00:00.000Z',
      siteBaseUrl: 'http://localhost:3006',
    });

    expect(result.seoTitle.length).toBeLessThanOrEqual(70);
    expect(result.seoDescription.length).toBeLessThanOrEqual(160);
    expect(result.canonicalUrl).toBe('http://localhost:3006/articles/sample-article');
    expect(result.structuredData['@type']).toBe('NewsArticle');
    expect(result.structuredData.datePublished).toBe('2026-01-01T00:00:00.000Z');
  });
});
