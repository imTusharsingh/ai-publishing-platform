import type { AiProvider } from './types';

export function resolveAiProvider(): AiProvider {
  const explicit = process.env.AI_WRITER_PROVIDER?.trim().toLowerCase();

  if (explicit === 'mock') {
    return 'mock';
  }

  if (explicit === 'openai') {
    if (!process.env.OPENAI_API_KEY?.trim()) {
      throw new Error('AI_WRITER_PROVIDER=openai requires OPENAI_API_KEY');
    }

    return 'openai';
  }

  if (process.env.OPENAI_API_KEY?.trim()) {
    return 'openai';
  }

  return 'mock';
}

export function getOpenAiModel(): string {
  return process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini';
}
