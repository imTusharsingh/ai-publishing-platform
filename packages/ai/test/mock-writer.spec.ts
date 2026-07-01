import { buildMockArticleContent } from '../src/mock-writer';

describe('buildMockArticleContent', () => {
  it('builds Medium-style layered html from outline sections', () => {
    const result = buildMockArticleContent('LMDB in production', 'Embedded store overview', [
      { heading: 'Easy', points: ['Analogy hook', 'Beginner takeaway'] },
      { heading: 'Moderate', points: ['Type: embedded KV', 'Speed: mmap reads'] },
    ]);

    expect(result.content).toContain('<h1>LMDB in production</h1>');
    expect(result.content).toContain('<strong>Easy:</strong>');
    expect(result.content).toContain('<h2>Moderate</h2>');
    expect(result.content).toContain('<h2>Hard</h2>');
    expect(result.content).toContain('<h2>In summary</h2>');
    expect(result.content).toContain("Here's the catch:");
    expect(result.contentPlain).toContain('mmap reads');
  });

  it('meets minimum word count for quality gate', () => {
    const result = buildMockArticleContent('Vector databases', null, []);
    const words = result.contentPlain.split(/\s+/).filter(Boolean).length;
    expect(words).toBeGreaterThanOrEqual(400);
  });
});
