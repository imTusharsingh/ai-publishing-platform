import type { TrendDiscoveryCategoryInput, TrendDiscoverySignalInput } from './types';

export const TREND_DISCOVERY_SYSTEM_PROMPT = `You are an editorial researcher for a technical news publication.

Return JSON only:
{"topics":[{"title":"string","description":"string","categoryId":"string","popularityScore":number,"sourceUrl":"string|null"}]}

Rules:
- Propose fresh editorial angles suitable for long-form articles — not verbatim reposts of headlines
- Each title must be clearly distinct from titles listed under EXISTING_TOPICS and RECENT_ARTICLES
- categoryId must be one of the provided category ids exactly
- popularityScore: integer 40-100 based on timeliness and editorial value
- sourceUrl: optional URL if inspired by a signal, otherwise null
- title: max 120 characters, specific and SEO-friendly
- description: max 240 characters — why this matters now
- No markdown, no extra keys`;

export function buildTrendDiscoveryPrompt(input: {
  categories: TrendDiscoveryCategoryInput[];
  maxTopics: number;
  existingTopicTitles: string[];
  recentArticleTitles: string[];
  signals: TrendDiscoverySignalInput[];
}): string {
  const categoryLines = input.categories
    .map(
      (category) =>
        `- id:${category.id} name:${category.name} keywords:${category.keywords.join(', ')}`,
    )
    .join('\n');

  const signalLines =
    input.signals.length > 0
      ? input.signals
          .slice(0, 20)
          .map((signal) => `- [${signal.source}] ${signal.title} — ${signal.description}`)
          .join('\n')
      : '- none';

  const existingLines =
    input.existingTopicTitles.length > 0
      ? input.existingTopicTitles
          .slice(0, 40)
          .map((title) => `- ${title}`)
          .join('\n')
      : '- none';

  const articleLines =
    input.recentArticleTitles.length > 0
      ? input.recentArticleTitles
          .slice(0, 30)
          .map((title) => `- ${title}`)
          .join('\n')
      : '- none';

  return [
    `COUNT:${input.maxTopics}`,
    'CATEGORIES:',
    categoryLines,
    'LIVE_SIGNALS:',
    signalLines,
    'EXISTING_TOPICS:',
    existingLines,
    'RECENT_ARTICLES:',
    articleLines,
  ].join('\n');
}
