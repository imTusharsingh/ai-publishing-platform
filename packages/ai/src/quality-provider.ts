import type { AiProvider } from './types';

export function resolveQualityProvider(): AiProvider {
  const explicit = process.env.AI_QUALITY_PROVIDER?.trim().toLowerCase();

  if (explicit === 'mock') {
    return 'mock';
  }

  if (explicit === 'openai') {
    if (!process.env.OPENAI_API_KEY?.trim()) {
      throw new Error('AI_QUALITY_PROVIDER=openai requires OPENAI_API_KEY');
    }

    return 'openai';
  }

  if (process.env.OPENAI_API_KEY?.trim()) {
    return 'openai';
  }

  return 'mock';
}
