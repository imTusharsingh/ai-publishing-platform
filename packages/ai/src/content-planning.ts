import { renderPromptTemplate } from '@repo/shared';
import { estimateOpenAiCostUsd } from './cost';
import { createOpenAiClient } from './openai-writer';
import { getOpenAiModel } from './provider';
import type {
  ArticleImageSuggestion,
  ArticleOutlineSection,
  ContentPlanningInput,
  ContentPlanningResult,
} from './types';

const DEFAULT_SYSTEM_PROMPT = `You are a senior editorial planner for a technical publication.

Expand the article idea into a write-ready content plan.

Return JSON only:
{
  "summary": "string",
  "outline": [{"heading":"string","points":["string"]}],
  "imageSuggestions": [
    {
      "position": "string",
      "type": "diagram|illustration|timeline|comparison|workflow",
      "title": "string",
      "description": "string",
      "alt": "string"
    }
  ],
  "narrativeNotes": "string"
}

Rules:
- Refine the outline into 6-10 sections with 4-6 concrete, write-ready points each
- Points should guide what to explain, with examples and practitioner angles
- summary: sharpen the editorial angle in 2-3 sentences (max 500 chars)
- Include 4-8 imageSuggestions for concepts that benefit from diagrams or illustrations
- Prefer conceptual diagrams over stock imagery; no UI screenshots unless essential
- narrativeNotes: voice, audience, and key angles for the writer (max 400 chars)
- No markdown, no extra keys`;

function parseOutline(value: unknown): ArticleOutlineSection[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((section) => {
      if (!section || typeof section !== 'object') {
        return null;
      }
      const record = section as Record<string, unknown>;
      const heading = typeof record.heading === 'string' ? record.heading.trim() : '';
      const points = Array.isArray(record.points)
        ? record.points
            .filter(
              (point): point is string => typeof point === 'string' && point.trim().length > 0,
            )
            .map((point) => point.trim())
        : [];
      if (!heading || points.length === 0) {
        return null;
      }
      return { heading, points };
    })
    .filter((section): section is ArticleOutlineSection => section !== null);
}

function parseImageSuggestions(value: unknown): ArticleImageSuggestion[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      if (!entry || typeof entry !== 'object') {
        return null;
      }
      const record = entry as Record<string, unknown>;
      const title = typeof record.title === 'string' ? record.title.trim() : '';
      const description = typeof record.description === 'string' ? record.description.trim() : '';
      if (!title || !description) {
        return null;
      }
      return {
        position: typeof record.position === 'string' ? record.position.trim() : 'in article body',
        type: typeof record.type === 'string' ? record.type.trim() : 'illustration',
        title,
        description,
        alt: typeof record.alt === 'string' ? record.alt.trim() : title,
      };
    })
    .filter((item): item is ArticleImageSuggestion => item !== null);
}

function parseContentPlan(
  raw: string,
): Omit<
  ContentPlanningResult,
  'provider' | 'model' | 'promptTokens' | 'completionTokens' | 'costUsd'
> {
  const parsed = JSON.parse(raw) as Record<string, unknown>;
  const summary = typeof parsed.summary === 'string' ? parsed.summary.trim() : '';
  const outline = parseOutline(parsed.outline);
  const imageSuggestions = parseImageSuggestions(parsed.imageSuggestions);
  const narrativeNotes =
    typeof parsed.narrativeNotes === 'string' ? parsed.narrativeNotes.trim() : undefined;

  if (!summary || outline.length === 0) {
    throw new Error('Content planning missing summary or outline');
  }

  return { summary, outline, imageSuggestions, narrativeNotes };
}

export function generateContentPlanWithMock(input: ContentPlanningInput): ContentPlanningResult {
  const baseOutline =
    input.outline.length > 0
      ? input.outline
      : [{ heading: 'Introduction', points: ['Context and relevance'] }];

  const outline = baseOutline.map((section) => ({
    heading: section.heading,
    points: [
      ...section.points,
      `Practical example illustrating ${section.heading.toLowerCase()}`,
      `Trade-offs and pitfalls teams encounter with ${section.heading.toLowerCase()}`,
    ],
  }));

  const imageSuggestions: ArticleImageSuggestion[] = outline.slice(0, 5).map((section, index) => ({
    position: index === 0 ? 'after introduction' : `in ${section.heading} section`,
    type: index % 2 === 0 ? 'diagram' : 'illustration',
    title: `${section.heading} overview`,
    description: `Conceptual ${index % 2 === 0 ? 'diagram' : 'illustration'} explaining ${section.heading.toLowerCase()} for technical readers`,
    alt: `${section.heading} conceptual diagram`,
  }));

  return {
    summary:
      input.summary?.trim() ||
      `A practitioner-focused exploration of ${input.title} for ${input.categoryName} readers.`,
    outline,
    imageSuggestions,
    narrativeNotes:
      'Write with an experienced engineer voice. Emphasize real-world trade-offs, examples, and visual placeholders.',
    provider: 'mock',
    model: 'mock-content-plan-v1',
    promptTokens: null,
    completionTokens: null,
    costUsd: null,
  };
}

export async function generateContentPlanWithOpenAI(
  input: ContentPlanningInput,
): Promise<ContentPlanningResult> {
  const client = createOpenAiClient();
  const model = getOpenAiModel();
  const outlineText =
    input.outline.length > 0
      ? input.outline.map((s) => `${s.heading}→${s.points.join('; ')}`).join(' | ')
      : 'auto';

  const userPrompt = input.prompts?.userPromptTemplate
    ? renderPromptTemplate(input.prompts.userPromptTemplate, {
        title: input.title,
        categoryName: input.categoryName,
        intent: input.intent ?? 'explainer',
        summary: input.summary ?? '',
        outline: outlineText,
      })
    : `TITLE:${input.title}\nCAT:${input.categoryName}\nINTENT:${input.intent ?? 'explainer'}\nSUMMARY:${input.summary ?? ''}\nOUTLINE:${outlineText}`;

  const response = await client.chat.completions.create({
    model,
    temperature: 0.35,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: input.prompts?.systemPrompt ?? DEFAULT_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
  });

  const content = response.choices[0]?.message?.content?.trim();
  if (!content) {
    throw new Error('OpenAI content planning returned empty response');
  }

  const plan = parseContentPlan(content);
  const promptTokens = response.usage?.prompt_tokens ?? null;
  const completionTokens = response.usage?.completion_tokens ?? null;

  return {
    ...plan,
    provider: 'openai',
    model,
    promptTokens,
    completionTokens,
    costUsd:
      promptTokens !== null && completionTokens !== null
        ? estimateOpenAiCostUsd(model, promptTokens, completionTokens)
        : null,
  };
}
