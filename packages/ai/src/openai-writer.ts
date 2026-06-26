import OpenAI from 'openai';
import { estimateOpenAiCostUsd } from './cost';
import { getOpenAiModel } from './provider';
import type { ArticleWriteInput, ArticleWriteResult } from './types';

function buildPrompt(input: ArticleWriteInput): string {
  const outlineText = input.outline.length
    ? input.outline
        .map((section) => `${section.heading}:\n- ${section.points.join('\n- ')}`)
        .join('\n\n')
    : 'No outline provided — write a coherent structure yourself.';

  return [
    `Title: ${input.title}`,
    `Category: ${input.categoryName}`,
    input.intent ? `Intent: ${input.intent}` : null,
    input.summary ? `Summary: ${input.summary}` : null,
    `Outline:\n${outlineText}`,
    '',
    'Write a complete editorial article as semantic HTML using h1, h2, p, and ul/li only.',
    'Return only HTML body content starting with a single h1. No markdown fences.',
  ]
    .filter(Boolean)
    .join('\n');
}

function stripCodeFences(value: string): string {
  return value
    .replace(/^```html\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

export function createOpenAiClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  return new OpenAI({ apiKey });
}

export async function writeArticleWithOpenAI(
  input: ArticleWriteInput,
  client: OpenAI = createOpenAiClient(),
): Promise<ArticleWriteResult> {
  const model = getOpenAiModel();

  const response = await client.chat.completions.create({
    model,
    temperature: 0.7,
    messages: [
      {
        role: 'system',
        content:
          'You are an expert technology journalist. Write clear, factual, engaging articles in HTML.',
      },
      {
        role: 'user',
        content: buildPrompt(input),
      },
    ],
  });

  const rawContent = response.choices[0]?.message?.content?.trim();
  if (!rawContent) {
    throw new Error('OpenAI returned empty article content');
  }

  const content = stripCodeFences(rawContent);
  const contentPlain = content
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const promptTokens = response.usage?.prompt_tokens ?? null;
  const completionTokens = response.usage?.completion_tokens ?? null;
  const costUsd =
    promptTokens !== null && completionTokens !== null
      ? estimateOpenAiCostUsd(model, promptTokens, completionTokens)
      : null;

  return {
    content,
    contentPlain,
    provider: 'openai',
    model,
    promptTokens,
    completionTokens,
    costUsd,
  };
}
