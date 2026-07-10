import {
  buildInlineImageFigure,
  countArticleImagePlaceholders,
  materializeInlineImagesInHtml,
} from '../src/article-inline-images.util';

describe('generate-article-inline-images', () => {
  it('counts image placeholders in html', () => {
    const html =
      '<p>Intro</p>[IMAGE: Diagram]<figure><img alt="Workflow"/></figure><figure><img src="/existing.png" alt="Done"/></figure>';

    expect(countArticleImagePlaceholders(html)).toBe(2);
  });

  it('materializes placeholders when suggestions include urls', () => {
    const html = '<p>Intro</p>[IMAGE: Request lifecycle diagram]<p>More</p>';
    const suggestions = [
      {
        position: 'after introduction',
        type: 'diagram',
        title: 'Request lifecycle',
        description: 'Request lifecycle diagram',
        alt: 'Request lifecycle diagram',
        url: '/media/articles/test-inline-0.svg',
      },
    ];

    const updated = materializeInlineImagesInHtml(html, suggestions);

    expect(updated).toContain('article-inline-image');
    expect(updated).toContain('/media/articles/test-inline-0.svg');
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
});
