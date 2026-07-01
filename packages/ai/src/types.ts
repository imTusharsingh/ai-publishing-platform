export interface ArticleOutlineSection {
  heading: string;
  points: string[];
}

export interface ArticleWriteInput {
  title: string;
  summary: string | null;
  outline: ArticleOutlineSection[];
  categoryName: string;
  intent?: string | null;
  /** Set when revising a draft that failed the quality gate. */
  qualityFeedback?: string | null;
}

export interface ArticleWriteResult {
  content: string;
  contentPlain: string;
  provider: 'mock' | 'openai';
  model: string;
  promptTokens: number | null;
  completionTokens: number | null;
  costUsd: number | null;
}

export interface IdeaPlanningInput {
  topicTitle: string;
  topicDescription: string | null;
  categoryName: string;
}

export interface IdeaPlanningResult {
  title: string;
  summary: string;
  intent: string;
  outline: ArticleOutlineSection[];
  provider: 'mock' | 'openai';
  model: string;
  promptTokens: number | null;
  completionTokens: number | null;
  costUsd: number | null;
}

export type ArticleWriterProvider = 'mock' | 'openai';
export type AiProvider = ArticleWriterProvider;

export type TrendSourceType = 'GOOGLE_TRENDS' | 'REDDIT' | 'TWITTER' | 'NEWS_API' | 'BLOG_RSS';

export type TrendDiscoveryProvider = 'mock' | 'live' | 'auto';

export interface TrendDiscoveryCategoryInput {
  id: string;
  name: string;
  keywords: string[];
  priorityScore: number;
}

export interface DiscoveredTrendCandidate {
  source: TrendSourceType;
  title: string;
  description: string;
  popularityScore: number;
  sourceUrl: string;
  matchedCategoryId: string | null;
}

export interface TrendDiscoveryInput {
  runId: string;
  categories: TrendDiscoveryCategoryInput[];
}

export interface TrendDiscoveryResult {
  trends: DiscoveredTrendCandidate[];
  provider: 'mock' | 'live';
  sources: string[];
}

export interface ArticleQualityInput {
  title: string;
  contentPlain: string;
  summary?: string | null;
}

export interface ArticleQualityScores {
  grammar: number;
  readability: number;
  spam: number;
}

export interface ArticleQualityResult {
  passed: boolean;
  scores: ArticleQualityScores;
  issues: string[];
  provider: 'mock' | 'openai';
  model: string;
  promptTokens: number | null;
  completionTokens: number | null;
  costUsd: number | null;
}
