import { evaluateQualityScores } from '../src/quality-thresholds';

describe('evaluateQualityScores', () => {
  it('passes when all scores meet thresholds', () => {
    const result = evaluateQualityScores({ grammar: 0.8, readability: 0.7, spam: 0.1 }, 200, {
      minGrammar: 0.7,
      minReadability: 0.55,
      maxSpam: 0.4,
      minWordCount: 120,
    });

    expect(result.passed).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it('fails when readability is below threshold', () => {
    const result = evaluateQualityScores({ grammar: 0.8, readability: 0.5, spam: 0.1 }, 200, {
      minGrammar: 0.7,
      minReadability: 0.55,
      maxSpam: 0.4,
      minWordCount: 120,
    });

    expect(result.passed).toBe(false);
    expect(result.issues[0]).toContain('Readability score');
  });
});
