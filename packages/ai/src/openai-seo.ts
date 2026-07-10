import { renderPromptTemplate } from '@repo/shared';
import { estimateOpenAiCostUsd } from './cost';
import { createOpenAiClient } from './openai-writer';
import { getOpenAiModel } from './provider';
import { generateSeoWithMock } from './mock-seo';
import type { ArticleSeoInput, ArticleSeoResult } from './seo-types';

interface OpenAiSeoResponse {
  seoTitle: string;
  seoDescription: string;
  keywords: string[];
}

export async function generateSeoWithOpenAI(input: ArticleSeoInput): Promise<ArticleSeoResult> {
  const client = createOpenAiClient();
  const model = getOpenAiModel();
  const base = generateSeoWithMock(input);

  const response = await client.chat.completions.create({
    model,
    temperature: 0.2,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content:
          input.prompts?.systemPrompt ??
          'You are an SEO editor. Return JSON: {"seoTitle":string,"seoDescription":string,"keywords":string[]}. seoTitle max 70 chars, seoDescription max 160 chars. No clickbait.',
      },
      {
        role: 'user',
        content: input.prompts?.userPromptTemplate
          ? renderPromptTemplate(input.prompts.userPromptTemplate, {
              title: input.title,
              categoryName: input.categoryName,
              summary: input.summary ?? '',
              contentPlain: input.contentPlain.slice(0, 2000),
            })
          : `Title: ${input.title}\nCategory: ${input.categoryName}\nSummary: ${input.summary ?? ''}\n\nBody excerpt:\n${input.contentPlain.slice(0, 2000)}`,
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    return { ...base, provider: 'openai', model };
  }

  const parsed = JSON.parse(content) as OpenAiSeoResponse;
  const promptTokens = response.usage?.prompt_tokens ?? null;
  const completionTokens = response.usage?.completion_tokens ?? null;
  const seoTitle = parsed.seoTitle?.trim().slice(0, 70) || base.seoTitle;
  const seoDescription = parsed.seoDescription?.trim().slice(0, 160) || base.seoDescription;
  const keywords = Array.isArray(parsed.keywords)
    ? parsed.keywords.map(String).slice(0, 10)
    : base.keywords;

  return {
    ...base,
    seoTitle,
    seoDescription,
    keywords,
    structuredData: {
      ...base.structuredData,
      headline: seoTitle,
      description: seoDescription,
      keywords: keywords.join(', '),
    },
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
