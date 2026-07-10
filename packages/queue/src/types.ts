export const QUEUE_NAMES = {
  DEFAULT: 'ai-publishing-default',
} as const;

export const JOB_NAMES = {
  PING: 'ping',
  TREND_DISCOVERY: 'trend-discovery',
  ARTICLE_WRITING: 'article-writing',
  EMBEDDING: 'embedding',
  DUPLICATE_CHECK: 'duplicate-check',
  QUALITY: 'quality',
  DAILY_PUBLISHING: 'daily-publishing',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];
export type JobName = (typeof JOB_NAMES)[keyof typeof JOB_NAMES];

export interface PingJobData {
  message: string;
}

export interface PingJobResult {
  pong: true;
  receivedAt: string;
  message: string;
}

export interface TrendDiscoveryJobData {
  runId: string;
}

export interface TrendDiscoveryJobResult {
  created: number;
  updated: number;
  skipped: number;
  fetched: number;
  runId: string;
}

export interface ArticleWritingJobData {
  ideaId: string;
}

export interface ArticleWritingJobResult {
  articleId: string;
  ideaId: string;
  slug: string;
  aiJobId: string;
}

export interface EmbeddingJobData {
  articleId: string;
}

export interface EmbeddingJobResult {
  articleId: string;
  aiJobId: string;
}

export interface DuplicateCheckJobData {
  articleId: string;
}

export interface DuplicateCheckJobResult {
  articleId: string;
  passed: boolean;
  aiJobId: string;
}

export interface QualityJobData {
  articleId: string;
}

export interface QualityJobResult {
  articleId: string;
  passed: boolean;
  aiJobId: string;
}

export interface DailyPublishingJobData {
  runId: string;
}

export interface DailyPublishingJobResult {
  runId: string;
  topicsDiscovered: number;
  ideasGenerated: number;
  articlesWritten: number;
  articlesPublished: number;
  failureCount: number;
}

export interface JobStatusResponse {
  id: string;
  name: string;
  queue: string;
  state: string;
  progress: number;
  attemptsMade: number;
  failedReason: string | null;
  finishedOn: number | null;
  processedOn: number | null;
  returnvalue: unknown;
  data: unknown;
}
