import type { IdeaPlanningInput } from './types';

export const IDEA_SYSTEM_PROMPT = `Editorial strategist for a technology publication that publishes Medium-style deep explainers.

Return a single JSON object only:
{"title":"string","summary":"string","intent":"analysis|explainer|roundup","outline":[{"heading":"string","points":["string"]}]}

Rules:
- title: compelling, specific, SEO-friendly (max 90 chars)
- summary: 2-3 sentences — hook, audience, and what readers will learn at each depth level (max 400 chars)
- intent: prefer "explainer" for technical topics
- outline: use Medium-style sections with concrete points:
  1) "Easy" — analogy hook, plain-language payoff, beginner takeaway
  2) "Moderate" — labeled feature bullets, advantages, things to consider
  3) "Hard" — architecture, concurrency, durability, performance, production pitfalls
  4) "In summary" — synthesis and when to use / when to avoid
  For list/ranking topics, replace Easy/Moderate/Hard with Overview, Criteria, per-item sections, and Outlook.
- 4-6 sections, 3-5 concrete points each
- No markdown, no extra keys`;

export function buildIdeaPrompt(input: IdeaPlanningInput): string {
  const desc = input.topicDescription?.trim() || 'none';
  return `TOPIC:${input.topicTitle}\nCAT:${input.categoryName}\nDESC:${desc}`;
}
