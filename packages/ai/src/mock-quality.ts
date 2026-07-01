import type { ArticleQualityInput, ArticleQualityResult, ArticleQualityScores } from './types';

const MIN_WORD_COUNT = 120;
const MAX_REPEATED_LINE_RATIO = 0.35;

function scoreGrammar(text: string): number {
  const sentences = text.split(/[.!?]+/).filter((part) => part.trim().length > 0);
  if (sentences.length === 0) {
    return 0;
  }

  const capitalizationHits = sentences.filter((sentence) => /^[A-Z]/.test(sentence.trim())).length;
  return Math.min(1, capitalizationHits / sentences.length);
}

function scoreReadability(text: string): number {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length < MIN_WORD_COUNT) {
    return words.length / MIN_WORD_COUNT;
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
  const issues: string[] = [];

  const scores: ArticleQualityScores = {
    grammar: scoreGrammar(text),
    readability: scoreReadability(text),
    spam: scoreSpam(text),
  };

  if (text.split(/\s+/).filter(Boolean).length < MIN_WORD_COUNT) {
    issues.push(`Article is shorter than ${MIN_WORD_COUNT} words`);
  }

  if (scores.grammar < 0.6) {
    issues.push('Grammar score below threshold');
  }

  if (scores.readability < 0.45) {
    issues.push('Readability score below threshold');
  }

  if (scores.spam >= 1) {
    issues.push('Repeated lines detected');
  }

  return {
    passed: issues.length === 0,
    scores,
    issues,
    provider: 'mock',
    model: 'mock-quality-v1',
    promptTokens: null,
    completionTokens: null,
    costUsd: null,
  };
}
