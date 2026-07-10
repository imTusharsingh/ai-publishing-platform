import { renderPromptTemplate } from '@repo/shared';
import OpenAI from 'openai';
import { estimateOpenAiCostUsd } from './cost';
import { getOpenAiTemperature, getOpenAiMaxCompletionTokens } from './openai-config';
import { createOpenAiClient } from './openai-writer';
import { getOpenAiModel } from './provider';
import { IDEA_SYSTEM_PROMPT, buildIdeaPrompt } from './openai-idea.prompt';
import type { ArticleOutlineSection, IdeaPlanningInput, IdeaPlanningResult } from './types';

const IDEA_MAX_COMPLETION_TOKENS = 900;

function parseIdeaResponse(
  raw: string,
): Omit<
  IdeaPlanningResult,
  'provider' | 'model' | 'promptTokens' | 'completionTokens' | 'costUsd'
> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('OpenAI returned invalid JSON for idea planning');
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('OpenAI returned invalid idea planning payload');
  }

  const record = parsed as Record<string, unknown>;
  const title = typeof record.title === 'string' ? record.title.trim() : '';
  const summary = typeof record.summary === 'string' ? record.summary.trim() : '';
  const intent = typeof record.intent === 'string' ? record.intent.trim() : 'analysis';

  if (!title || !summary) {
    throw new Error('OpenAI idea planning missing title or summary');
  }

  const outline = parseOutline(record.outline);
  if (outline.length === 0) {
    throw new Error('OpenAI idea planning returned empty outline');
  }

  return { title, summary, intent, outline };
}

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

export async function generateIdeaWithOpenAI(
  input: IdeaPlanningInput,
  client: OpenAI = createOpenAiClient(),
): Promise<IdeaPlanningResult> {
  const model = getOpenAiModel();
  const temperature = Math.min(getOpenAiTemperature(), 0.5);
  const maxTokens = Math.min(getOpenAiMaxCompletionTokens(), IDEA_MAX_COMPLETION_TOKENS);

  const userPrompt = input.prompts?.userPromptTemplate
    ? renderPromptTemplate(input.prompts.userPromptTemplate, {
        topicTitle: input.topicTitle,
        categoryName: input.categoryName,
        topicDescription: input.topicDescription?.trim() || 'none',
      })
    : buildIdeaPrompt(input);

  const userContent = input.duplicateFeedback?.trim()
    ? `${userPrompt}\n\nAVOID DUPLICATE — choose a distinct title and editorial angle:\n${input.duplicateFeedback.trim()}`
    : userPrompt;

  const response = await client.chat.completions.create({
    model,
    temperature,
    max_tokens: maxTokens,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: input.prompts?.systemPrompt ?? IDEA_SYSTEM_PROMPT },
      {
        role: 'user',
        content: userContent,
      },
    ],
  });

  const rawContent = response.choices[0]?.message?.content?.trim();
  if (!rawContent) {
    throw new Error('OpenAI returned empty idea planning content');
  }

  const idea = parseIdeaResponse(rawContent);
  const promptTokens = response.usage?.prompt_tokens ?? null;
  const completionTokens = response.usage?.completion_tokens ?? null;
  const costUsd =
    promptTokens !== null && completionTokens !== null
      ? estimateOpenAiCostUsd(model, promptTokens, completionTokens)
      : null;

  return {
    ...idea,
    provider: 'openai',
    model,
    promptTokens,
    completionTokens,
    costUsd,
  };
}
