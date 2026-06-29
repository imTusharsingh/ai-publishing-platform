import { generateIdeaWithMock } from './mock-idea-generator';
import { generateIdeaWithOpenAI } from './openai-idea-generator';
import { resolveAiProvider } from './provider';
import type { IdeaPlanningInput, IdeaPlanningResult } from './types';

export async function generateIdeaContent(input: IdeaPlanningInput): Promise<IdeaPlanningResult> {
  const provider = resolveAiProvider();

  if (provider === 'openai') {
    return generateIdeaWithOpenAI(input);
  }

  return generateIdeaWithMock(input);
}
