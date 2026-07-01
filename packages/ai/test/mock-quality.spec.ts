import { validateQualityWithMock } from '../src/mock-quality';

describe('validateQualityWithMock', () => {
  it('passes well-formed articles', () => {
    const content = Array.from({ length: 140 }, (_, index) => `Word${index}`).join(' ');
    const sentences = Array.from(
      { length: 8 },
      (_, index) => `Sentence ${index} explains the topic clearly.`,
    ).join(' ');
    const contentPlain = `${content}\n\n${sentences}`;

    const result = validateQualityWithMock({
      title: 'Quality test article',
      contentPlain,
      summary: 'A solid summary',
    });

    expect(result.passed).toBe(true);
    expect(result.scores.grammar).toBeGreaterThan(0.6);
  });

  it('fails very short articles', () => {
    const result = validateQualityWithMock({
      title: 'Too short',
      contentPlain: 'Only a few words here.',
    });

    expect(result.passed).toBe(false);
    expect(result.issues.length).toBeGreaterThan(0);
  });
});
