import type { IdeaPlanningInput, IdeaPlanningResult } from './types';

export function refineMockIdeaTitle(topicTitle: string): string {
  return topicTitle.replace(/\s*\([^)]*\)\s*$/, '').trim();
}

export function buildMockIdeaSummary(topicTitle: string, description?: string | null): string {
  if (description?.trim()) {
    return `${description.trim()} Readers will move from an intuitive mental model through implementation detail, practical scenarios, and production recommendations.`;
  }

  return `A publication-quality explainer on ${topicTitle}: what it is, why it matters, how it works under the hood, and when to choose it over alternatives.`;
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
      heading: 'Easy',
      points: [
        'Everyday analogy without jargon',
        'Multiple concrete examples',
        "Limitations and misconceptions (Here's the catch)",
      ],
    },
    {
      heading: 'Moderate Understanding',
      points: [
        'Core concepts and workflow',
        'Labeled characteristics: speed, memory, trade-offs',
        'Advantages, limitations, and common use cases',
      ],
    },
    {
      heading: 'Advanced Deep Dive',
      points: [
        'Internal architecture and concurrency',
        'Failure modes and edge cases',
        'Production debugging and security considerations',
      ],
    },
    {
      heading: 'Practical Examples',
      points: [
        'When to adopt vs when to avoid',
        'Common mistakes teams make',
        'Better alternatives for mismatched workloads',
      ],
    },
    {
      heading: 'Best Practices',
      points: [
        'Benchmarking and key design',
        'Observability and backup discipline',
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
    model: 'mock-idea-v3-publication',
    promptTokens: null,
    completionTokens: null,
    costUsd: null,
  };
}
