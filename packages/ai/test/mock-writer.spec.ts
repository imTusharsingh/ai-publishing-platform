import { buildMockArticleContent } from '../src/mock-writer';

describe('buildMockArticleContent', () => {
  it('builds publication-quality sectioned html', () => {
    const result = buildMockArticleContent('LMDB in production', 'Embedded store overview', [
      { heading: 'How It Works', points: ['Core concepts', 'Workflow'] },
    ]);

    expect(result.content).toContain('<h1>LMDB in production</h1>');
    expect(result.content).toContain('<h2>Introduction</h2>');
    expect(result.content).toContain('<h2>Core Concepts and Fundamentals</h2>');
    expect(result.content).toContain('<h2>How It Works</h2>');
    expect(result.content).toContain('<h2>Trade-offs and Comparisons</h2>');
    expect(result.content).toContain('<h2>Real-World Applications</h2>');
    expect(result.content).toContain('<h2>Best Practices</h2>');
    expect(result.content).toContain('<h2>Conclusion</h2>');
    expect(result.content).not.toContain('<strong>Easy:</strong>');
    expect(result.contentPlain).toContain('Workflow');
  });

  it('meets minimum word count for quality gate', () => {
    const result = buildMockArticleContent('Vector databases', null, []);
    const words = result.contentPlain.split(/\s+/).filter(Boolean).length;
    expect(words).toBeGreaterThanOrEqual(1500);
  });
});
