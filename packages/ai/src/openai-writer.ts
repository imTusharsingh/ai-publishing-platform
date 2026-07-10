import OpenAI from 'openai';
import { estimateOpenAiCostUsd } from './cost';
import { getOpenAiWriterConfig } from './openai-config';
import { ARTICLE_SYSTEM_PROMPT, buildArticlePrompt } from './openai-writer.prompt';
import type { ArticleWriteInput, ArticleWriteResult } from './types';

export { ARTICLE_SYSTEM_PROMPT, buildArticlePrompt };

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
  const { model, temperature, maxCompletionTokens } = getOpenAiWriterConfig();

  const response = await client.chat.completions.create({
    model,
    temperature,
    max_tokens: maxCompletionTokens,
    messages: [
      { role: 'system', content: input.prompts?.systemPrompt ?? ARTICLE_SYSTEM_PROMPT },
      { role: 'user', content: buildArticlePrompt(input) },
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
