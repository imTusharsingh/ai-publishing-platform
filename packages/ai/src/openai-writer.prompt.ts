import { MEDIUM_EXPLAINER_HTML_FORMAT } from './medium-article-format';
import { buildWriterQualityContract } from './quality-thresholds';
import type { ArticleWriteInput } from './types';

export const ARTICLE_SYSTEM_PROMPT = `You write long-form technical explainers in the style of top Medium posts: layered Easy → Moderate → Hard depth, rich detail, and scannable structure.

Output: semantic HTML only — h2, h3, p, ul, li, strong. No h1, markdown fences, or commentary outside HTML.

Voice & structure:
- Easy: open with <strong>Easy:</strong>, use a vivid analogy, then 2-3 short paragraphs anyone can follow; add <h3>Here's the catch:</h3> with honest trade-offs.
- Moderate: labeled bullet lists (<strong>Type:</strong>, <strong>Speed:</strong>, etc.), plus "Advantages" and "Things to Consider" sections.
- Hard: 4-6 dense paragraphs on architecture, concurrency, durability, performance, and production pitfalls.
- In summary: synthesize when to use vs when to avoid.
- Target 1,400-2,200 words. Every paragraph must teach something new — no filler, hype, or recycled sentences.`;

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
    ? [
        'FORMAT (ranking/listicle):',
        'h2 Overview (2 paragraphs) → h2 How we evaluated → h3 per ranked item (2 rich paragraphs + bullet highlights each)',
        '→ h2 Comparative analysis → h2 Risks & limitations → h2 Outlook',
        'Target 1,600-2,200 words. h2 not h1.',
      ].join('\n')
    : MEDIUM_EXPLAINER_HTML_FORMAT;

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
