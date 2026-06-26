import { writeArticleWithMock } from './mock-writer';
import { writeArticleWithOpenAI } from './openai-writer';
import { resolveArticleWriterProvider } from './provider';
import type { ArticleWriteInput, ArticleWriteResult } from './types';

export async function writeArticleContent(input: ArticleWriteInput): Promise<ArticleWriteResult> {
  const provider = resolveArticleWriterProvider();

  if (provider === 'openai') {
    return writeArticleWithOpenAI(input);
  }

  return writeArticleWithMock(input);
}
