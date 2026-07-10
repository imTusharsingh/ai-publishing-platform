import type { IdeaPlanningInput, IdeaPlanningResult } from './types';

export function refineMockIdeaTitle(topicTitle: string): string {
  return topicTitle.replace(/\s*\([^)]*\)\s*$/, '').trim();
}

export function buildMockIdeaSummary(topicTitle: string, description?: string | null): string {
  if (description?.trim()) {
    return `${description.trim()} Readers will move from core concepts through mechanics, trade-offs, real-world scenarios, and production recommendations.`;
  }

  return `A long-form explainer on ${topicTitle}: what it is, why it matters, how it works, where it fits against alternatives, and how to apply it well in practice.`;
}

export function buildMockIdeaOutline(topicTitle: string): IdeaPlanningResult['outline'] {
  return [
    {
      heading: 'Introduction',
      points: [
        `What ${topicTitle} is and why practitioners care`,
        'Where readers encounter it in real systems',
        'Questions this article will answer',
      ],
    },
    {
      heading: 'Core Concepts and Fundamentals',
      points: [
        'Key ideas explained in plain language',
        'Everyday analogies and concrete examples',
        'Common misconceptions to address',
      ],
    },
    {
      heading: 'How It Works',
      points: [
        'Mechanics, workflow, and architecture',
        'Labeled characteristics: speed, memory, complexity',
        'Advantages and limitations',
      ],
    },
    {
      heading: 'Trade-offs and Comparisons',
      points: [
        'When it excels vs when alternatives win',
        'Performance and operational trade-offs',
        'Decision framework for teams',
      ],
    },
    {
      heading: 'Real-World Applications',
      points: [
        'When to adopt vs when to avoid',
        'Common mistakes teams make',
        'Production scenarios and pitfalls',
      ],
    },
    {
      heading: 'Best Practices',
      points: [
        'Benchmarking and design discipline',
        'Observability and backup strategy',
        'Operational runbooks',
      ],
    },
    {
      heading: 'Conclusion',
      points: [
        'Problem it solves and where it excels',
        'When another approach is preferable',
        'Key takeaways for builders',
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
    model: 'mock-idea-v4-publication',
    promptTokens: null,
    completionTokens: null,
    costUsd: null,
  };
}
