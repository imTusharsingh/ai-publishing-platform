import {
  buildMockFeaturedImageSvg,
  generateFeaturedImageWithMock,
  resolveArticleImageProvider,
} from '../src/article-featured-image';

describe('article-featured-image', () => {
  const input = {
    title: 'Minicor: Revolutionizing Windows Desktop Automation at Scale',
    summary: 'A deep dive into desktop automation.',
    categoryName: 'Artificial Intelligence',
    slug: 'minicor-revolutionizing-windows-desktop-automation-at-scale',
  };

  it('builds abstract svg cover art without text', () => {
    const svg = buildMockFeaturedImageSvg(input);

    expect(svg).toContain('<svg');
    expect(svg).not.toContain('Minicor');
    expect(svg).not.toContain('ARTIFICIAL INTELLIGENCE');
    expect(svg).not.toContain('<text');
  });

  it('returns mock image bytes by default', () => {
    const previous = process.env.AI_IMAGE_PROVIDER;
    process.env.AI_IMAGE_PROVIDER = 'mock';

    const result = generateFeaturedImageWithMock(input);

    expect(result.provider).toBe('mock');
    expect(result.extension).toBe('svg');
    expect(result.data.toString('utf8')).toContain('<svg');

    process.env.AI_IMAGE_PROVIDER = previous;
  });

  it('defaults image provider from api key', () => {
    const previousProvider = process.env.AI_IMAGE_PROVIDER;
    const previousKey = process.env.OPENAI_API_KEY;

    delete process.env.AI_IMAGE_PROVIDER;
    delete process.env.OPENAI_API_KEY;
    expect(resolveArticleImageProvider()).toBe('mock');

    process.env.OPENAI_API_KEY = 'test-key';
    expect(resolveArticleImageProvider()).toBe('openai');

    process.env.AI_IMAGE_PROVIDER = previousProvider;
    process.env.OPENAI_API_KEY = previousKey;
  });
});
