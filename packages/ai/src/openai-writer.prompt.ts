import { renderPromptTemplate } from '@repo/shared';
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
  const explainerFormat = input.prompts?.explainerFormat ?? PUBLICATION_EXPLAINER_FORMAT;
  const listicleFormat = input.prompts?.listicleFormat ?? PUBLICATION_LISTICLE_FORMAT;
  const formatBlock = listicle ? listicleFormat : explainerFormat;
  const qualityContract = input.prompts?.qualityContract ?? buildWriterQualityContract();

  const intentLine = input.intent ? `INTENT:${input.intent}` : '';
  const summaryLine = input.summary ? `BRIEF:${input.summary}` : '';
  const revisionBlock = input.qualityFeedback
    ? `REVISE:Previous draft failed quality review. Fix these issues and rewrite the full article from scratch at full length:\n${input.qualityFeedback}\nIf word count is mentioned, the revision MUST exceed the minimum word count — expand sections rather than trimming.`
    : '';

  if (input.prompts?.userPromptTemplate) {
    return renderPromptTemplate(input.prompts.userPromptTemplate, {
      title: input.title,
      categoryName: input.categoryName,
      intentLine,
      summaryLine,
      outline,
      formatBlock,
      qualityContract,
      revisionBlock,
    });
  }

  const lines = [
    `TITLE:${input.title}`,
    `CAT:${input.categoryName}`,
    intentLine || null,
    summaryLine || null,
    `OUTLINE:${outline}`,
    formatBlock,
    qualityContract,
    revisionBlock || null,
  ];

  return lines.filter(Boolean).join('\n');
}
