import { renderPromptTemplate } from '@repo/shared';
import OpenAI from 'openai';
import { normalizeTopicTitle } from '@repo/shared';
import { estimateOpenAiCostUsd } from './cost';
import { getOpenAiTemperature } from './openai-config';
import { TREND_DISCOVERY_SYSTEM_PROMPT, buildTrendDiscoveryPrompt } from './openai-trend.prompt';
import { createOpenAiClient } from './openai-writer';
import { getOpenAiModel } from './provider';
import type {
  DiscoveredTrendCandidate,
  TrendDiscoveryCategoryInput,
  TrendDiscoveryInput,
  TrendDiscoveryResult,
  TrendDiscoverySignalInput,
} from './types';

const TREND_DISCOVERY_MAX_COMPLETION_TOKENS = 1800;

interface ParsedTopic {
  title: string;
  description: string;
  categoryId: string;
  popularityScore: number;
  sourceUrl: string | null;
}

function parseTrendDiscoveryResponse(raw: string): ParsedTopic[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('OpenAI returned invalid JSON for trend discovery');
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('OpenAI returned invalid trend discovery payload');
  }

  const topics = (parsed as Record<string, unknown>).topics;
  if (!Array.isArray(topics)) {
    throw new Error('OpenAI trend discovery missing topics array');
  }

  return topics
    .map((entry) => {
      if (!entry || typeof entry !== 'object') {
        return null;
      }

      const record = entry as Record<string, unknown>;
      const title = typeof record.title === 'string' ? record.title.trim() : '';
      const description = typeof record.description === 'string' ? record.description.trim() : '';
      const categoryId = typeof record.categoryId === 'string' ? record.categoryId.trim() : '';
      const popularityScore =
        typeof record.popularityScore === 'number'
          ? Math.max(40, Math.min(100, Math.round(record.popularityScore)))
          : 70;
      const sourceUrl =
        typeof record.sourceUrl === 'string' && record.sourceUrl.trim().length > 0
          ? record.sourceUrl.trim()
          : null;

      if (!title || !description || !categoryId) {
        return null;
      }

      return {
        title,
        description,
        categoryId,
        popularityScore,
        sourceUrl,
      };
    })
    .filter((topic): topic is ParsedTopic => topic !== null);
}

function dedupeGeneratedTopics(
  topics: ParsedTopic[],
  existingTopicTitles: string[],
  recentArticleTitles: string[],
): ParsedTopic[] {
  const blocked = new Set(
    [...existingTopicTitles, ...recentArticleTitles].map((title) => normalizeTopicTitle(title)),
  );
  const seen = new Set<string>();
  const result: ParsedTopic[] = [];

  for (const topic of topics) {
    const key = normalizeTopicTitle(topic.title);
    if (!key || blocked.has(key) || seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(topic);
  }

  return result;
}

function toCandidates(
  topics: ParsedTopic[],
  categories: TrendDiscoveryCategoryInput[],
): DiscoveredTrendCandidate[] {
  const categoryIds = new Set(categories.map((category) => category.id));

  return topics
    .filter((topic) => categoryIds.has(topic.categoryId))
    .map((topic) => ({
      source: 'BLOG_RSS',
      title: topic.title,
      description: topic.description,
      popularityScore: topic.popularityScore,
      sourceUrl:
        topic.sourceUrl ?? `https://editorial.local/topics/${encodeURIComponent(topic.title)}`,
      matchedCategoryId: topic.categoryId,
    }));
}

export async function discoverTopicsWithOpenAI(
  input: TrendDiscoveryInput & {
    maxTopics: number;
    signals?: TrendDiscoverySignalInput[];
  },
  client: OpenAI = createOpenAiClient(),
): Promise<TrendDiscoveryResult & { model: string; costUsd: number | null }> {
  const model = getOpenAiModel();
  const temperature = Math.min(getOpenAiTemperature(), 0.7);
  const existingTopicTitles = input.existingTopicTitles ?? [];
  const recentArticleTitles = input.recentArticleTitles ?? [];
  const signals = input.signals ?? [];

  const response = await client.chat.completions.create({
    model,
    temperature,
    max_tokens: TREND_DISCOVERY_MAX_COMPLETION_TOKENS,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: input.prompts?.systemPrompt ?? TREND_DISCOVERY_SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: input.prompts?.userPromptTemplate
          ? renderPromptTemplate(input.prompts.userPromptTemplate, {
              maxTopics: String(input.maxTopics),
              categories: input.categories
                .map(
                  (category) =>
                    `- id:${category.id} name:${category.name} keywords:${category.keywords.join(', ')}`,
                )
                .join('\n'),
              signals:
                signals.length > 0
                  ? signals
                      .slice(0, 20)
                      .map(
                        (signal) => `- [${signal.source}] ${signal.title} — ${signal.description}`,
                      )
                      .join('\n')
                  : '- none',
              existingTopics:
                existingTopicTitles.length > 0
                  ? existingTopicTitles
                      .slice(0, 40)
                      .map((title) => `- ${title}`)
                      .join('\n')
                  : '- none',
              recentArticles:
                recentArticleTitles.length > 0
                  ? recentArticleTitles
                      .slice(0, 30)
                      .map((title) => `- ${title}`)
                      .join('\n')
                  : '- none',
            })
          : buildTrendDiscoveryPrompt({
              categories: input.categories,
              maxTopics: input.maxTopics,
              existingTopicTitles,
              recentArticleTitles,
              signals,
            }),
      },
    ],
  });

  const rawContent = response.choices[0]?.message?.content?.trim();
  if (!rawContent) {
    throw new Error('OpenAI returned empty trend discovery content');
  }

  const parsed = parseTrendDiscoveryResponse(rawContent);
  const deduped = dedupeGeneratedTopics(parsed, existingTopicTitles, recentArticleTitles).slice(
    0,
    input.maxTopics,
  );
  const trends = toCandidates(deduped, input.categories);

  if (trends.length === 0) {
    throw new Error('OpenAI trend discovery returned no unique topics');
  }

  const promptTokens = response.usage?.prompt_tokens ?? null;
  const completionTokens = response.usage?.completion_tokens ?? null;
  const costUsd =
    promptTokens !== null && completionTokens !== null
      ? estimateOpenAiCostUsd(model, promptTokens, completionTokens)
      : null;

  const sources = ['openai'];
  if (signals.length > 0) {
    sources.push('live-signals');
  }

  return {
    trends,
    provider: 'openai',
    sources,
    model,
    costUsd,
  };
}
