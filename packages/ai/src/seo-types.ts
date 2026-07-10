export interface ArticleSeoInput {
  title: string;
  summary: string | null;
  contentPlain: string;
  categoryName: string;
  slug: string;
  authorName?: string;
  publishedAt?: string | null;
  siteBaseUrl?: string;
  prompts?: {
    systemPrompt?: string;
    userPromptTemplate?: string;
  };
}

export interface ArticleSeoResult {
  seoTitle: string;
  seoDescription: string;
  canonicalUrl: string;
  ogImageUrl: string | null;
  keywords: string[];
  structuredData: Record<string, unknown>;
  provider: 'mock' | 'openai';
  model: string;
  promptTokens: number | null;
  completionTokens: number | null;
  costUsd: number | null;
}
