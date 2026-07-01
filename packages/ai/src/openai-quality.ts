import { estimateOpenAiCostUsd } from './cost';
import { createOpenAiClient } from './openai-writer';
import { getOpenAiModel } from './provider';
import type { ArticleQualityInput, ArticleQualityResult } from './types';

interface QualityResponse {
  passed: boolean;
  grammar: number;
  readability: number;
  spam: number;
  issues: string[];
}

export async function validateQualityWithOpenAI(
  input: ArticleQualityInput,
): Promise<ArticleQualityResult> {
  const client = createOpenAiClient();
  const model = getOpenAiModel();

  const response = await client.chat.completions.create({
    model,
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content:
          'You are a strict news editor. Score grammar, readability, and spam risk from 0 to 1. Return JSON: {"passed":boolean,"grammar":number,"readability":number,"spam":number,"issues":string[]}. Fail if grammar<0.7, readability<0.55, spam>0.4, or article is incoherent.',
      },
      {
        role: 'user',
        content: `Title: ${input.title}\nSummary: ${input.summary ?? ''}\n\nArticle:\n${input.contentPlain.slice(0, 6000)}`,
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('OpenAI quality validation returned empty response');
  }

  const parsed = JSON.parse(content) as QualityResponse;
  const promptTokens = response.usage?.prompt_tokens ?? null;
  const completionTokens = response.usage?.completion_tokens ?? null;

  return {
    passed: Boolean(parsed.passed),
    scores: {
      grammar: Number(parsed.grammar),
      readability: Number(parsed.readability),
      spam: Number(parsed.spam),
    },
    issues: Array.isArray(parsed.issues) ? parsed.issues.map(String) : [],
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
