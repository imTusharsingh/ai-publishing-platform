import type { IdeaPlanningInput, IdeaPlanningResult } from './types';

export function refineMockIdeaTitle(topicTitle: string): string {
  const trimmed = topicTitle.replace(/\s*\([^)]*\)\s*$/, '').trim();
  return trimmed;
}

export function buildMockIdeaSummary(topicTitle: string, description?: string | null): string {
  if (description?.trim()) {
    return `${description.trim()} This explainer moves from intuitive analogies to engineering depth so both newcomers and practitioners leave with actionable understanding.`;
  }

  return `A Medium-style deep dive on ${topicTitle}: start with an easy analogy, build a structured feature breakdown, then cover architecture, trade-offs, and real-world use cases.`;
}

export function buildMockIdeaOutline(topicTitle: string): IdeaPlanningResult['outline'] {
  return [
    {
      heading: 'Easy',
      points: [
        `Everyday analogy that makes ${topicTitle} intuitive`,
        'Plain-language payoff for non-experts',
        'Honest limitations ("Here\'s the catch")',
      ],
    },
    {
      heading: 'Moderate',
      points: [
        'Type, structure, speed, memory, and API surface',
        'Advantages with concrete examples',
        'Things to consider before adopting',
      ],
    },
    {
      heading: 'Hard',
      points: [
        'Internal design and on-disk layout',
        'Concurrency, durability, and crash behavior',
        'Benchmarks, production patterns, and pitfalls',
      ],
    },
    {
      heading: 'In summary',
      points: [
        'When this technology is the right fit',
        'When to choose an alternative',
        'Key takeaway for builders and decision-makers',
      ],
    },
  ];
}

export function generateIdeaWithMock(input: IdeaPlanningInput): IdeaPlanningResult {
  return {
    title: refineMockIdeaTitle(input.topicTitle),
    summary: buildMockIdeaSummary(input.topicTitle, input.topicDescription),
    intent: 'explainer',
    outline: buildMockIdeaOutline(input.topicTitle),
    provider: 'mock',
    model: 'mock-idea-v2-medium',
    promptTokens: null,
    completionTokens: null,
    costUsd: null,
  };
}
