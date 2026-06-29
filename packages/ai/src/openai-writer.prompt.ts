import type { ArticleWriteInput } from './types';

/** Compact system prompt — high signal, low token count. */
export const ARTICLE_SYSTEM_PROMPT = `Senior technology and business analyst writing for a professional publication.

Output: semantic HTML only — h2, h3, p, ul, li. No h1, markdown fences, or commentary outside HTML.

Quality bar:
- Publication-grade, analytical, specific. No filler, hype, or generic transitions.
- Each h2: 2–4 tight paragraphs with concrete facts, examples, and implications.
- List/ranking topics: one h3 per item; under each h3, two paragraphs (what they do; strategic significance).
- Cover context, competitive landscape, risks, and forward outlook.
- Prefer precise language over length. Every sentence must add information.`;

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
  const format = listicle
    ? 'FORMAT:h2 Overview→h2 Selection criteria→h3 per ranked item (2 paragraphs each)→h2 Comparative analysis→h2 Risks→h2 Outlook | ~1400-1800 words dense | h2 not h1'
    : 'FORMAT:h2 Overview→body sections→h2 Outlook | ~1000-1400 words dense | h2 not h1';

  const lines = [
    `TITLE:${input.title}`,
    `CAT:${input.categoryName}`,
    input.intent ? `INTENT:${input.intent}` : null,
    input.summary ? `BRIEF:${input.summary}` : null,
    `OUTLINE:${outline}`,
    format,
  ];

  return lines.filter(Boolean).join('\n');
}
