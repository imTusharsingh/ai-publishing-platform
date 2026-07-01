import type { IdeaPlanningInput } from './types';

export const IDEA_SYSTEM_PROMPT = `Editorial strategist for a top technical publication.

Return a single JSON object only:
{"title":"string","summary":"string","intent":"analysis|explainer|roundup","outline":[{"heading":"string","points":["string"]}]}

Rules:
- title: compelling, specific, SEO-friendly (max 90 chars)
- summary: 2-3 sentences — what it is, why it matters, what readers will learn (max 400 chars)
- intent: prefer "explainer" for technical topics
- outline: align with publication article structure (4-7 sections, 3-5 concrete points each):
  1) Introduction — hook, relevance, where readers encounter the topic
  2) Easy — analogy, plain-language payoff, misconceptions to address
  3) Moderate Understanding — core concepts, workflow, advantages, limitations, use cases
  4) Advanced Deep Dive — architecture, concurrency, failure modes, production concerns
  5) Practical Examples — when to use, when to avoid, common mistakes
  6) Best Practices — actionable recommendations
  7) Conclusion — synthesis and key takeaways
  For list/ranking topics, use Overview, Criteria, per-item sections, Comparison, and Conclusion.
- No markdown, no extra keys`;

export function buildIdeaPrompt(input: IdeaPlanningInput): string {
  const desc = input.topicDescription?.trim() || 'none';
  return `TOPIC:${input.topicTitle}\nCAT:${input.categoryName}\nDESC:${desc}`;
}
