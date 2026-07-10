import { generateSeoWithMock } from './mock-seo';
import { generateSeoWithOpenAI } from './openai-seo';
import { resolveSeoProvider } from './seo-provider';
import type { ArticleSeoInput, ArticleSeoResult } from './seo-types';

export type { ArticleSeoInput, ArticleSeoResult } from './seo-types';

export async function generateArticleSeo(input: ArticleSeoInput): Promise<ArticleSeoResult> {
  const provider = resolveSeoProvider();

  if (provider === 'openai') {
    return generateSeoWithOpenAI(input);
  }

  return generateSeoWithMock(input);
}
