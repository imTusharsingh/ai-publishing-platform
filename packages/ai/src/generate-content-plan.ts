import { generateContentPlanWithMock, generateContentPlanWithOpenAI } from './content-planning';
import { resolveAiProvider } from './provider';
import type { ContentPlanningInput, ContentPlanningResult } from './types';

export async function generateContentPlan(
  input: ContentPlanningInput,
): Promise<ContentPlanningResult> {
  if (resolveAiProvider() === 'openai') {
    return generateContentPlanWithOpenAI(input);
  }

  return generateContentPlanWithMock(input);
}
