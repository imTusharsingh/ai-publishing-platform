import { buildArticlePrompt, ARTICLE_SYSTEM_PROMPT } from '../src/openai-writer.prompt';

describe('buildArticlePrompt', () => {
  it('uses compact single-line fields to reduce prompt tokens', () => {
    const prompt = buildArticlePrompt({
      title: 'Top 10 AI startups',
      summary: 'Healthcare focus in India',
      outline: [{ heading: 'Leaders', points: ['Company A', 'Company B'] }],
      categoryName: 'Healthcare',
      intent: 'analysis',
    });

    expect(prompt).toContain('TITLE:Top 10 AI startups');
    expect(prompt).toContain('BRIEF:Healthcare focus in India');
    expect(prompt).toContain('Leaders→Company A; Company B');
    expect(prompt).toContain('no h1');
  });

  it('uses listicle structure for top-N titles', () => {
    const prompt = buildArticlePrompt({
      title: 'Top 10 AI startups in India',
      summary: null,
      outline: [],
      categoryName: 'Healthcare',
    });

    expect(prompt).toContain('h3 per ranked item');
    expect(prompt).toContain('Comparative analysis');
  });

  it('uses publication explainer structure for standard articles', () => {
    const prompt = buildArticlePrompt({
      title: 'Lightning Memory-Mapped Database',
      summary: 'Embedded key-value store',
      outline: [],
      categoryName: 'Databases',
      intent: 'explainer',
    });

    expect(prompt).toContain('Introduction');
    expect(prompt).toContain('Easy:');
    expect(prompt).toContain('Moderate Understanding');
    expect(prompt).toContain('Advanced Deep Dive');
    expect(prompt).toContain('Practical Examples');
    expect(prompt).toContain('Best Practices');
    expect(prompt).toContain('Conclusion');
  });

  it('system prompt defines publication-quality expert writer role', () => {
    expect(ARTICLE_SYSTEM_PROMPT).toContain('expert writer, researcher, educator, and editor');
    expect(ARTICLE_SYSTEM_PROMPT).toContain('publication-quality');
    expect(ARTICLE_SYSTEM_PROMPT).toContain("Let's dive in");
    expect(ARTICLE_SYSTEM_PROMPT).toContain('1,500–2,500 words');
  });

  it('includes quality gate contract in user prompt', () => {
    const prompt = buildArticlePrompt({
      title: 'AI policy shifts',
      summary: 'Regulators move faster',
      outline: [],
      categoryName: 'Policy',
    });

    expect(prompt).toContain('QUALITY GATE');
    expect(prompt).toContain('At least 400 words');
  });
});
