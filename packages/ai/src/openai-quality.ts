import { renderPromptTemplate } from '@repo/shared';
import { estimateOpenAiCostUsd } from './cost';
import { createOpenAiClient } from './openai-writer';
import { getOpenAiModel } from './provider';
import { evaluateQualityScores } from './quality-thresholds';
import type { ArticleQualityInput, ArticleQualityResult } from './types';

interface QualityResponse {
  grammar: number;
  readability: number;
  spam: number;
  notes?: string[];
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
          input.prompts?.systemPrompt ??
          'You are a news editor scoring draft articles. Return JSON only: {"grammar":number,"readability":number,"spam":number,"notes":string[]}. All scores are 0-1 where higher grammar/readability is better and higher spam is worse.',
      },
      {
        role: 'user',
        content: input.prompts?.userPromptTemplate
          ? renderPromptTemplate(input.prompts.userPromptTemplate, {
              title: input.title,
              summary: input.summary ?? '',
              contentPlain: input.contentPlain.slice(0, 10000),
            })
          : `Title: ${input.title}\nSummary: ${input.summary ?? ''}\n\nArticle:\n${input.contentPlain.slice(0, 10000)}`,
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('OpenAI quality validation returned empty response');
  }

  const parsed = JSON.parse(content) as QualityResponse;
  const scores = {
    grammar: Number(parsed.grammar),
    readability: Number(parsed.readability),
    spam: Number(parsed.spam),
  };
  const wordCount = input.contentPlain.split(/\s+/).filter(Boolean).length;
  const evaluation = evaluateQualityScores(scores, wordCount);
  const modelNotes = Array.isArray(parsed.notes) ? parsed.notes.map(String) : [];

  const promptTokens = response.usage?.prompt_tokens ?? null;
  const completionTokens = response.usage?.completion_tokens ?? null;

  return {
    passed: evaluation.passed,
    scores,
    issues: evaluation.passed ? modelNotes : [...evaluation.issues, ...modelNotes],
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
