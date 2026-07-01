import { validateQualityWithMock } from './mock-quality';
import { validateQualityWithOpenAI } from './openai-quality';
import { resolveAiProvider } from './provider';
import type { ArticleQualityInput, ArticleQualityResult } from './types';

export async function validateArticleQuality(
  input: ArticleQualityInput,
): Promise<ArticleQualityResult> {
  const provider = resolveAiProvider();

  if (provider === 'openai') {
    return validateQualityWithOpenAI(input);
  }

  return validateQualityWithMock(input);
}
