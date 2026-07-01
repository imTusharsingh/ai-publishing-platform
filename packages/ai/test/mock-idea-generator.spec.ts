import { generateIdeaWithMock } from '../src/mock-idea-generator';

describe('generateIdeaWithMock', () => {
  it('returns structured idea plan', () => {
    const result = generateIdeaWithMock({
      topicTitle: 'AI chips surge',
      topicDescription: 'Semiconductor demand rises',
      categoryName: 'Tech',
    });

    expect(result.provider).toBe('mock');
    expect(result.title).toContain('AI chips surge');
    expect(result.summary).toContain('Semiconductor demand rises');
    expect(result.outline.some((section) => section.heading === 'Easy')).toBe(true);
  });
});
