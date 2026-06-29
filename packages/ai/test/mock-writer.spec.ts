import { buildMockArticleContent } from '../src/mock-writer';

describe('buildMockArticleContent', () => {
  it('builds html from outline sections', () => {
    const result = buildMockArticleContent('AI in India', 'Market overview', [
      { heading: 'Leaders', points: ['Company A', 'Company B'] },
    ]);

    expect(result.content).toContain('<h1>AI in India</h1>');
    expect(result.content).toContain('<h2>Leaders</h2>');
    expect(result.contentPlain).toContain('Company A');
  });
});
