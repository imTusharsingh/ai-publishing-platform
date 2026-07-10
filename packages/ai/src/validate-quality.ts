import { validateQualityWithMock } from './mock-quality';
import { validateQualityWithOpenAI } from './openai-quality';
import { resolveQualityProvider } from './quality-provider';
import type { ArticleQualityInput, ArticleQualityResult } from './types';

export async function validateArticleQuality(
  input: ArticleQualityInput,
): Promise<ArticleQualityResult> {
  const provider = resolveQualityProvider();

  if (provider === 'openai') {
    return validateQualityWithOpenAI(input);
  }

  return validateQualityWithMock(input);
}
