import { renderPromptTemplate } from '@repo/shared';

describe('renderPromptTemplate', () => {
  it('replaces known variables', () => {
    const result = renderPromptTemplate('Title: {{title}}\nSummary: {{summary}}', {
      title: 'AI Trading',
      summary: 'A deep dive.',
    });

    expect(result).toBe('Title: AI Trading\nSummary: A deep dive.');
  });

  it('uses empty string for missing variables', () => {
    const result = renderPromptTemplate('Category: {{categoryName}}', {});
    expect(result).toBe('Category: ');
  });
});
