import type { IdeaPlanningInput } from './types';

export const IDEA_SYSTEM_PROMPT = `Editorial strategist for a technology publication.

Return a single JSON object only:
{"title":"string","summary":"string","intent":"analysis|explainer|roundup","outline":[{"heading":"string","points":["string"]}]}

Rules:
- title: compelling, specific, SEO-friendly (max 90 chars)
- summary: 2-3 sentences — audience, angle, key questions to answer (max 400 chars)
- outline: 4-6 sections, 2-4 concrete points each; for list/ranking topics include a section per major item
- No markdown, no extra keys`;

export function buildIdeaPrompt(input: IdeaPlanningInput): string {
  const desc = input.topicDescription?.trim() || 'none';
  return `TOPIC:${input.topicTitle}\nCAT:${input.categoryName}\nDESC:${desc}`;
}
