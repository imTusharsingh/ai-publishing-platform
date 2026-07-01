import {
  ARTICLE_SYSTEM_PROMPT,
  PUBLICATION_EXPLAINER_FORMAT,
  PUBLICATION_LISTICLE_FORMAT,
} from './publication-writer.prompt';
import { buildWriterQualityContract } from './quality-thresholds';
import type { ArticleWriteInput } from './types';

export { ARTICLE_SYSTEM_PROMPT };

const LIST_TITLE_PATTERN = /\b(top\s*\d+|top\s+ten|\d+\s+best|ranking|roundup)\b/i;

function isListicleTitle(title: string): boolean {
  return LIST_TITLE_PATTERN.test(title);
}

function countOutlineItems(outline: ArticleWriteInput['outline']): number {
  return outline.reduce((sum, section) => sum + section.points.length, 0);
}

export function buildArticlePrompt(input: ArticleWriteInput): string {
  const outline =
    input.outline.length > 0
      ? input.outline.map((s) => `${s.heading}→${s.points.join('; ')}`).join(' | ')
      : 'auto';

  const listicle = isListicleTitle(input.title) || countOutlineItems(input.outline) >= 5;
  const format = listicle ? PUBLICATION_LISTICLE_FORMAT : PUBLICATION_EXPLAINER_FORMAT;

  const lines = [
    `TITLE:${input.title}`,
    `CAT:${input.categoryName}`,
    input.intent ? `INTENT:${input.intent}` : null,
    input.summary ? `BRIEF:${input.summary}` : null,
    `OUTLINE:${outline}`,
    format,
    buildWriterQualityContract(),
    input.qualityFeedback
      ? `REVISE:Previous draft failed quality review. Fix these issues and rewrite the full article:\n${input.qualityFeedback}`
      : null,
  ];

  return lines.filter(Boolean).join('\n');
}
