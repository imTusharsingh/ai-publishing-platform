import { buildMockArticleContent } from '../src/mock-writer';

describe('buildMockArticleContent', () => {
  it('builds publication-quality layered html', () => {
    const result = buildMockArticleContent('LMDB in production', 'Embedded store overview', [
      { heading: 'Easy', points: ['Analogy hook', 'Beginner takeaway'] },
      { heading: 'Moderate Understanding', points: ['Core concepts', 'Workflow'] },
    ]);

    expect(result.content).toContain('<h1>LMDB in production</h1>');
    expect(result.content).toContain('<h2>Introduction</h2>');
    expect(result.content).toContain('<strong>Easy:</strong>');
    expect(result.content).toContain("<h3>Here's the catch</h3>");
    expect(result.content).toContain('<h2>Moderate Understanding</h2>');
    expect(result.content).toContain('<h2>Advanced Deep Dive</h2>');
    expect(result.content).toContain('<h2>Practical Examples</h2>');
    expect(result.content).toContain('<h2>Best Practices</h2>');
    expect(result.content).toContain('<h2>Conclusion</h2>');
    expect(result.contentPlain).toContain('Workflow');
  });

  it('meets minimum word count for quality gate', () => {
    const result = buildMockArticleContent('Vector databases', null, []);
    const words = result.contentPlain.split(/\s+/).filter(Boolean).length;
    expect(words).toBeGreaterThanOrEqual(400);
  });
});
