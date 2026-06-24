export type TrendSource =
  | 'GOOGLE_TRENDS'
  | 'REDDIT'
  | 'TWITTER'
  | 'NEWS_API'
  | 'BLOG_RSS';

export type TopicStatus =
  | 'DISCOVERED'
  | 'SUGGESTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'USED'
  | 'EXPIRED';

export interface TopicSummary {
  id: string;
  source: TrendSource;
  title: string;
  normalizedTitle: string;
  description: string | null;
  popularityScore: number;
  sourceUrl: string | null;
  matchedCategoryId: string | null;
  matchedCategoryName: string | null;
  status: TopicStatus;
  discoveredAt: string;
}

export interface TopicListResponse {
  data: TopicSummary[];
  meta: { total: number; page: number; limit: number };
}

export interface MockTrendInput {
  source: TrendSource;
  title: string;
  description: string;
  popularityScore: number;
  sourceUrl: string;
}

export const MOCK_TREND_BATCH: MockTrendInput[] = [
  {
    source: 'GOOGLE_TRENDS',
    title: 'Generative AI in enterprise workflows',
    description: 'Rising interest in applying LLMs to internal tooling.',
    popularityScore: 88.5,
    sourceUrl: 'https://trends.google.com/mock/generative-ai-enterprise',
  },
  {
    source: 'REDDIT',
    title: 'Indie hackers shipping AI publishing stacks',
    description: 'Community discussion on automated content pipelines.',
    popularityScore: 72.25,
    sourceUrl: 'https://reddit.com/r/SideProject/mock/ai-publishing',
  },
  {
    source: 'NEWS_API',
    title: 'Regulators weigh AI-generated news disclosure rules',
    description: 'Policy debate on labeling machine-assisted articles.',
    popularityScore: 65.0,
    sourceUrl: 'https://news.example.com/mock/ai-disclosure',
  },
];

export function normalizeTopicTitle(title: string): string {
  return title.toLowerCase().replace(/\s+/g, ' ').trim();
}
