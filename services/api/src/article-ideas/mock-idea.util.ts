import type { ArticleIdeaOutlineSection } from './article-ideas.types';

export function buildMockOutline(topicTitle: string): ArticleIdeaOutlineSection[] {
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

export function buildMockSummary(topicTitle: string, description?: string | null): string {
  if (description?.trim()) {
    return description.trim();
  }

  return `An editorial brief exploring ${topicTitle}, covering recent trends, context, and what readers should know.`;
}

export function refineMockTitle(topicTitle: string): string {
  const trimmed = topicTitle.replace(/\s*\([^)]*\)\s*$/, '').trim();
  return `How ${trimmed} is reshaping the industry`;
}
