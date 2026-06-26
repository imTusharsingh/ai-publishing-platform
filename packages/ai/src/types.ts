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

export type ArticleWriterProvider = 'mock' | 'openai';
