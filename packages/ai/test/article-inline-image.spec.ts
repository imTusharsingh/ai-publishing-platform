import {
  buildInlineImagePrompt,
  buildMockInlineImageSvg,
  generateInlineImageWithMock,
} from '../src/article-inline-image';

describe('article-inline-image', () => {
  const input = {
    slug: 'test-article',
    index: 0,
    categoryName: 'Technology',
    suggestion: {
      title: 'Request lifecycle',
      description: 'Diagram showing request flow through the system',
      alt: 'Request lifecycle diagram',
      type: 'diagram',
    },
  };

  it('builds an editorial prompt from the suggestion', () => {
    const prompt = buildInlineImagePrompt(input.suggestion, input.categoryName);

    expect(prompt).toContain('Request lifecycle');
    expect(prompt).toContain('diagram');
    expect(prompt).toContain('Technology');
  });

  it('builds abstract inline svg without text', () => {
    const svg = buildMockInlineImageSvg(input);

    expect(svg).toContain('<svg');
    expect(svg).not.toContain('Request lifecycle');
    expect(svg).not.toContain('<text');
  });

  it('returns mock inline image bytes', () => {
    const result = generateInlineImageWithMock(input);

    expect(result.provider).toBe('mock');
    expect(result.extension).toBe('svg');
    expect(result.data.toString('utf8')).toContain('<svg');
  });
});
