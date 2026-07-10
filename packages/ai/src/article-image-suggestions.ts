import { renderPromptTemplate } from '@repo/shared';
import { estimateOpenAiCostUsd } from './cost';
import { createOpenAiClient } from './openai-writer';
import { getOpenAiModel } from './provider';

export interface ArticleImageSuggestion {
  position: string;
  type: string;
  title: string;
  description: string;
  alt: string;
  url?: string;
}

export interface ArticleImageSuggestionsInput {
  title: string;
  summary: string | null;
  categoryName: string;
  contentPlain: string;
  prompts?: {
    systemPrompt?: string;
    userPromptTemplate?: string;
  };
}

export interface ArticleImageSuggestionsResult {
  images: ArticleImageSuggestion[];
  provider: 'openai';
  model: string;
  promptTokens: number | null;
  completionTokens: number | null;
  costUsd: number | null;
}

const DEFAULT_SYSTEM_PROMPT = `You are an editorial art director.

For the article below, generate 4-8 image suggestions.

Return JSON only.

{
  "images":[
    {
      "position":"after introduction",
      "type":"diagram|illustration|timeline|comparison|workflow",
      "title":"string",
      "description":"detailed image prompt",
      "alt":"accessibility text"
    }
  ]
}

Rules:

- Images must improve understanding.
- Prefer conceptual illustrations.
- Avoid generic stock images.
- Avoid screenshots unless explicitly requested.
- Include diagrams for technical explanations.
- Include comparison graphics when discussing trade-offs.
- Include workflow diagrams when explaining processes.`;

function parseSuggestions(raw: string): ArticleImageSuggestion[] {
  const parsed = JSON.parse(raw) as { images?: unknown };
  if (!Array.isArray(parsed.images)) {
    return [];
  }

  return parsed.images
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

export async function generateArticleImageSuggestionsWithOpenAI(
  input: ArticleImageSuggestionsInput,
): Promise<ArticleImageSuggestionsResult> {
  const client = createOpenAiClient();
  const model = getOpenAiModel();
  const systemPrompt = input.prompts?.systemPrompt ?? DEFAULT_SYSTEM_PROMPT;
  const userPrompt = input.prompts?.userPromptTemplate
    ? renderPromptTemplate(input.prompts.userPromptTemplate, {
        title: input.title,
        categoryName: input.categoryName,
        summary: input.summary ?? '',
        contentPlain: input.contentPlain.slice(0, 12000),
      })
    : `Title: ${input.title}\nCategory: ${input.categoryName}\nSummary: ${input.summary ?? ''}\n\nArticle:\n${input.contentPlain.slice(0, 12000)}`;

  const response = await client.chat.completions.create({
    model,
    temperature: 0.4,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  });

  const content = response.choices[0]?.message?.content?.trim();
  if (!content) {
    throw new Error('OpenAI image suggestions returned empty response');
  }

  const promptTokens = response.usage?.prompt_tokens ?? null;
  const completionTokens = response.usage?.completion_tokens ?? null;

  return {
    images: parseSuggestions(content),
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
