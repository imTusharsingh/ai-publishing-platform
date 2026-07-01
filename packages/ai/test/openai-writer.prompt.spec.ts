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
    expect(prompt).toContain('h2 not h1');
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

  it('uses Medium-style Easy/Moderate/Hard format for explainers', () => {
    const prompt = buildArticlePrompt({
      title: 'Lightning Memory-Mapped Database',
      summary: 'Embedded key-value store',
      outline: [],
      categoryName: 'Databases',
      intent: 'explainer',
    });

    expect(prompt).toContain('Easy:');
    expect(prompt).toContain('Moderate');
    expect(prompt).toContain('Hard');
    expect(prompt).toContain('In summary');
  });

  it('system prompt requires Medium-style layered depth', () => {
    expect(ARTICLE_SYSTEM_PROMPT).toContain('Medium');
    expect(ARTICLE_SYSTEM_PROMPT).toContain('Easy');
    expect(ARTICLE_SYSTEM_PROMPT).toContain('no filler');
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
