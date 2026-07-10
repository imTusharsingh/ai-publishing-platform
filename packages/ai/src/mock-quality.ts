import { evaluateQualityScores, resolveQualityThresholds } from './quality-thresholds';
import type { ArticleQualityInput, ArticleQualityResult, ArticleQualityScores } from './types';

const MAX_REPEATED_LINE_RATIO = 0.35;

function scoreGrammar(text: string): number {
  const sentences = text.split(/[.!?]+/).filter((part) => part.trim().length > 0);
  if (sentences.length === 0) {
    return 0;
  }

  const capitalizationHits = sentences.filter((sentence) => /^[A-Z]/.test(sentence.trim())).length;
  return Math.min(1, capitalizationHits / sentences.length);
}

function scoreReadability(text: string, minWordCount: number): number {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length < minWordCount) {
    return words.length / minWordCount;
  }

  const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
  const readability = 1 - Math.min(1, Math.abs(avgWordLength - 5.5) / 5.5);
  return Math.max(0, readability);
}

function scoreSpam(text: string): number {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) {
    return 1;
  }

  const counts = new Map<string, number>();
  for (const line of lines) {
    counts.set(line, (counts.get(line) ?? 0) + 1);
  }

  const repeated = Array.from(counts.values()).filter((count) => count > 1).length;
  return Math.min(1, repeated / Math.max(1, lines.length) / MAX_REPEATED_LINE_RATIO);
}

export function validateQualityWithMock(input: ArticleQualityInput): ArticleQualityResult {
  const text = input.contentPlain.trim();
  const thresholds = resolveQualityThresholds();

  const scores: ArticleQualityScores = {
    grammar: scoreGrammar(text),
    readability: scoreReadability(text, thresholds.minWordCount),
    spam: scoreSpam(text),
  };

  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const evaluation = evaluateQualityScores(scores, wordCount, thresholds);

  if (scores.spam >= 1) {
    evaluation.issues.push('Repeated lines detected');
    evaluation.passed = false;
  }

  return {
    passed: evaluation.passed,
    scores,
    issues: evaluation.issues,
    provider: 'mock',
    model: 'mock-quality-v1',
    promptTokens: null,
    completionTokens: null,
    costUsd: null,
  };
}
