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
    expect(prompt).toContain('Narrative flow');
    expect(prompt).toContain('Real-World Applications');
    expect(prompt).toContain('Best Practices');
    expect(prompt).toContain('Conclusion');
    expect(prompt).not.toContain('Easy:');
  });

  it('system prompt defines human publication writer spec', () => {
    expect(ARTICLE_SYSTEM_PROMPT).toContain('award-winning technical writer');
    expect(ARTICLE_SYSTEM_PROMPT).toContain('AUTHOR VOICE');
    expect(ARTICLE_SYSTEM_PROMPT).toContain('VISUAL CONTENT');
    expect(ARTICLE_SYSTEM_PROMPT).toContain('PRACTITIONER INSIGHTS');
    expect(ARTICLE_SYSTEM_PROMPT).toContain('SILENT PLANNING');
    expect(ARTICLE_SYSTEM_PROMPT).toContain("Let's dive in");
    expect(ARTICLE_SYSTEM_PROMPT).toContain('3000–5000 words');
  });

  it('includes quality gate contract in user prompt', () => {
    const prompt = buildArticlePrompt({
      title: 'AI policy shifts',
      summary: 'Regulators move faster',
      outline: [],
      categoryName: 'Policy',
    });

    expect(prompt).toContain('QUALITY GATE');
    expect(prompt).toContain('At least 3000 words');
    expect(prompt).toContain('minimum three substantive paragraphs');
    expect(prompt).toContain('Conclusion must synthesize');
  });
});
