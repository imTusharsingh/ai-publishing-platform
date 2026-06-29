import type { IdeaPlanningInput, IdeaPlanningResult } from './types';

export function refineMockIdeaTitle(topicTitle: string): string {
  const trimmed = topicTitle.replace(/\s*\([^)]*\)\s*$/, '').trim();
  return `How ${trimmed} is reshaping the industry`;
}

export function buildMockIdeaSummary(topicTitle: string, description?: string | null): string {
  if (description?.trim()) {
    return description.trim();
  }

  return `An editorial brief exploring ${topicTitle}, covering recent trends, context, and what readers should know.`;
}

export function buildMockIdeaOutline(topicTitle: string): IdeaPlanningResult['outline'] {
  return [
    {
      heading: 'Introduction',
      points: [`Context for ${topicTitle}`, 'Why this matters now'],
    },
    {
      heading: 'Key developments',
      points: ['Recent signals and data points', 'Stakeholder reactions'],
    },
    {
      heading: 'Implications',
      points: ['Short-term impact', 'What to watch next'],
    },
  ];
}

export function generateIdeaWithMock(input: IdeaPlanningInput): IdeaPlanningResult {
  return {
    title: refineMockIdeaTitle(input.topicTitle),
    summary: buildMockIdeaSummary(input.topicTitle, input.topicDescription),
    intent: 'analysis',
    outline: buildMockIdeaOutline(input.topicTitle),
    provider: 'mock',
    model: 'mock-idea-v1',
    promptTokens: null,
    completionTokens: null,
    costUsd: null,
  };
}
