import type { AiProvider } from './types';

export function resolveSeoProvider(): AiProvider {
  const explicit = process.env.AI_SEO_PROVIDER?.trim().toLowerCase();

  if (explicit === 'mock') {
    return 'mock';
  }

  if (explicit === 'openai') {
    if (!process.env.OPENAI_API_KEY?.trim()) {
      throw new Error('AI_SEO_PROVIDER=openai requires OPENAI_API_KEY');
    }

    return 'openai';
  }

  if (process.env.OPENAI_API_KEY?.trim()) {
    return 'openai';
  }

  return 'mock';
}

export function getPublicSiteBaseUrl(): string {
  const cors = process.env.CORS_ORIGIN?.split(',')[0]?.trim();
  return process.env.PUBLIC_SITE_URL?.trim() || cors || 'http://localhost:3006';
}
