import type { IdeaPlanningInput } from './types';

export const IDEA_SYSTEM_PROMPT = `Editorial strategist for a top technical publication.

Return a single JSON object only:
{"title":"string","summary":"string","intent":"analysis|explainer|roundup","outline":[{"heading":"string","points":["string"]}]}

Rules:
- title: compelling, specific, SEO-friendly (max 90 chars)
- summary: 2-3 sentences — what it is, why it matters, what readers will learn (max 400 chars)
- intent: prefer "explainer" for technical topics
- outline: align with long-form publication structure (6-8 sections, 3-5 concrete points each):
  1) Introduction — hook, relevance, what readers will learn
  2) Core concepts and fundamentals — key ideas, definitions in context
  3) How it works — mechanics, workflow, architecture
  4) Trade-offs and comparisons — limitations, alternatives, when to choose what
  5) Real-world applications — scenarios, adoption patterns, common mistakes
  6) Best practices — actionable recommendations
  7) Conclusion — synthesis and key takeaways
  For list/ranking topics, use Overview, Criteria, per-item sections, Comparison, and Conclusion.
- Do not use difficulty labels (Easy, Moderate, Advanced, Beginner, Hard).
- No markdown, no extra keys`;

export function buildIdeaPrompt(input: IdeaPlanningInput): string {
  const desc = input.topicDescription?.trim() || 'none';
  const lines = [`TOPIC:${input.topicTitle}`, `CAT:${input.categoryName}`, `DESC:${desc}`];

  if (input.duplicateFeedback?.trim()) {
    lines.push(`AVOID_DUPLICATE:${input.duplicateFeedback.trim()}`);
  }

  return lines.join('\n');
}
