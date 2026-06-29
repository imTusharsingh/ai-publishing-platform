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
