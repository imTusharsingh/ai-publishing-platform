import {
  enrichArticleHtmlWithImages,
  extractArticleJsonLd,
  isHtmlContent,
  parseImageSuggestionsFromStructuredData,
  prepareArticleHtml,
} from '@/lib/article-content';

describe('article-content', () => {
  it('strips leading h1 from html body', () => {
    const html = '<h1>Title</h1><p>Body</p>';
    expect(prepareArticleHtml(html)).toBe('<p>Body</p>');
  });

  it('detects html content', () => {
    expect(isHtmlContent('<p>Hi</p>')).toBe(true);
    expect(isHtmlContent('Plain text')).toBe(false);
  });

  it('extracts JSON-LD without pipeline metadata', () => {
    const jsonLd = extractArticleJsonLd({
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      headline: 'Test',
      imageSuggestions: [{ title: 'Diagram' }],
    });

    expect(jsonLd).toEqual({
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      headline: 'Test',
    });
  });

  it('parses image suggestions from structured data', () => {
    const suggestions = parseImageSuggestionsFromStructuredData({
      imageSuggestions: [
        {
          title: 'Architecture diagram',
          description: 'Shows request flow',
          type: 'diagram',
        },
      ],
    });

    expect(suggestions).toHaveLength(1);
    expect(suggestions[0]?.title).toBe('Architecture diagram');
  });

  it('replaces [IMAGE:] markers with illustration placeholders', () => {
    const html = '<p>Intro</p>[IMAGE: Request lifecycle diagram]<p>More</p>';
    const enriched = enrichArticleHtmlWithImages(html, [
      {
        title: 'Request lifecycle',
        description: 'Shows request lifecycle diagram',
        type: 'diagram',
        alt: 'Request lifecycle diagram',
      },
    ]);

    expect(enriched).toContain('article-illustration');
    expect(enriched).toContain('Request lifecycle');
    expect(enriched).not.toContain('[IMAGE:');
  });

  it('replaces empty figure/img placeholders from writer HTML', () => {
    const html =
      '<figure><img alt="Comparison of approaches"/><figcaption>Trade-offs</figcaption></figure>';
    const enriched = enrichArticleHtmlWithImages(html);

    expect(enriched).toContain('article-illustration');
    expect(enriched).toContain('Comparison of approaches');
  });

  it('renders generated inline images when suggestion urls are present', () => {
    const html = '<p>Intro</p>[IMAGE: Request lifecycle diagram]<p>More</p>';
    const enriched = enrichArticleHtmlWithImages(html, [
      {
        title: 'Request lifecycle',
        description: 'Request lifecycle diagram',
        type: 'diagram',
        alt: 'Request lifecycle diagram',
        url: '/media/articles/demo-inline-0.svg',
      },
    ]);

    expect(enriched).toContain('article-inline-image');
    expect(enriched).toContain('/media/articles/demo-inline-0.svg');
    expect(enriched).not.toContain('article-illustration-frame');
  });
});
