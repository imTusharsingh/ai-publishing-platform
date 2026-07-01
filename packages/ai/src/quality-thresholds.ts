import type { ArticleQualityScores } from './types';

export interface QualityThresholds {
  minGrammar: number;
  minReadability: number;
  maxSpam: number;
  minWordCount: number;
}

export const DEFAULT_QUALITY_THRESHOLDS: QualityThresholds = {
  minGrammar: 0.7,
  minReadability: 0.55,
  maxSpam: 0.4,
  minWordCount: 400,
};

/** Compact quality contract injected into writer prompts so drafts pass the gate first try. */
export function buildWriterQualityContract(
  thresholds: QualityThresholds = resolveQualityThresholds(),
): string {
  return [
    `QUALITY GATE (must pass):`,
    `- At least ${thresholds.minWordCount} words across Easy, Moderate, and Hard sections`,
    `- Medium-style structure: analogy intro, labeled bullets, technical depth, summary`,
    `- Clear grammar, capitalization, and complete sentences`,
    `- Readable voice: mix short and medium sentences; explain jargon when used`,
    `- No repeated paragraphs, boilerplate, or list-only stubs without prose`,
    `- Each major h2 section: multiple substantive paragraphs plus supporting lists`,
  ].join('\n');
}

export function resolveQualityThresholds(): QualityThresholds {
  return {
    minGrammar: Number(process.env.QUALITY_MIN_GRAMMAR ?? DEFAULT_QUALITY_THRESHOLDS.minGrammar),
    minReadability: Number(
      process.env.QUALITY_MIN_READABILITY ?? DEFAULT_QUALITY_THRESHOLDS.minReadability,
    ),
    maxSpam: Number(process.env.QUALITY_MAX_SPAM ?? DEFAULT_QUALITY_THRESHOLDS.maxSpam),
    minWordCount: Number(process.env.QUALITY_MIN_WORDS ?? DEFAULT_QUALITY_THRESHOLDS.minWordCount),
  };
}

export function evaluateQualityScores(
  scores: ArticleQualityScores,
  wordCount: number,
  thresholds: QualityThresholds = resolveQualityThresholds(),
): { passed: boolean; issues: string[] } {
  const issues: string[] = [];

  if (wordCount < thresholds.minWordCount) {
    issues.push(`Article is shorter than ${thresholds.minWordCount} words`);
  }

  if (scores.grammar < thresholds.minGrammar) {
    issues.push(`Grammar score ${scores.grammar.toFixed(2)} is below ${thresholds.minGrammar}`);
  }

  if (scores.readability < thresholds.minReadability) {
    issues.push(
      `Readability score ${scores.readability.toFixed(2)} is below ${thresholds.minReadability}`,
    );
  }

  if (scores.spam > thresholds.maxSpam) {
    issues.push(`Spam risk score ${scores.spam.toFixed(2)} exceeds ${thresholds.maxSpam}`);
  }

  return { passed: issues.length === 0, issues };
}
