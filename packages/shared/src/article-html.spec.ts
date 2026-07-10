import {
  buildIllustrationPlaceholder,
  buildInlineImageFigure,
  countArticleImagePlaceholders,
  escapeArticleHtml,
  parseImageSuggestions,
  replaceArticleImagePlaceholders,
} from './article-html';

describe('article-html', () => {
  it('parses image suggestions from structured data', () => {
    const suggestions = parseImageSuggestions([
      {
        title: 'Architecture diagram',
        description: 'Shows request flow',
        type: 'diagram',
        url: '/media/articles/demo-inline-0.svg',
      },
    ]);

    expect(suggestions).toHaveLength(1);
    expect(suggestions[0]?.url).toBe('/media/articles/demo-inline-0.svg');
  });

  it('counts image placeholders in html', () => {
    const html =
      '<p>Intro</p>[IMAGE: Diagram]<figure><img alt="Workflow"/></figure><figure><img src="/existing.png" alt="Done"/></figure>';

    expect(countArticleImagePlaceholders(html)).toBe(2);
  });

  it('materializes placeholders when urls are available', () => {
    const html = '<p>Intro</p>[IMAGE: Request lifecycle diagram]<p>More</p>';
    const updated = replaceArticleImagePlaceholders(
      html,
      [
        {
          position: 'after introduction',
          type: 'diagram',
          title: 'Request lifecycle',
          description: 'Request lifecycle diagram',
          alt: 'Request lifecycle diagram',
          url: '/media/articles/test-inline-0.svg',
        },
      ],
      { requireUrl: true },
    );

    expect(updated).toContain('article-inline-image');
    expect(updated).toContain('/media/articles/test-inline-0.svg');
    expect(updated).not.toContain('[IMAGE:');
  });

  it('renders illustration placeholders when urls are missing', () => {
    const html = '<p>Intro</p>[IMAGE: Request lifecycle diagram]<p>More</p>';
    const updated = replaceArticleImagePlaceholders(html, [
      {
        position: 'after introduction',
        type: 'diagram',
        title: 'Request lifecycle',
        description: 'Request lifecycle diagram',
        alt: 'Request lifecycle diagram',
      },
    ]);

    expect(updated).toContain('article-illustration');
    expect(updated).not.toContain('[IMAGE:');
  });

  it('builds accessible inline image figures', () => {
    const figure = buildInlineImageFigure({
      position: 'in article body',
      type: 'diagram',
      title: 'Architecture',
      description: 'Shows system architecture',
      alt: 'Architecture diagram',
      url: '/media/articles/demo-inline-0.svg',
    });

    expect(figure).toContain('<img src="/media/articles/demo-inline-0.svg"');
    expect(figure).toContain('alt="Architecture diagram"');
    expect(figure).toContain('<figcaption>Architecture</figcaption>');
  });

  it('escapes html in placeholder captions', () => {
    const figure = buildIllustrationPlaceholder('unsafe <script>', {
      position: 'in article body',
      type: 'diagram',
      title: 'Bad <title>',
      description: 'unsafe <script>',
      alt: 'unsafe <script>',
    });

    expect(figure).not.toContain('<script>');
    expect(figure).toContain('&lt;script&gt;');
    expect(escapeArticleHtml('<">&')).toBe('&lt;&quot;&gt;&amp;');
  });
});
