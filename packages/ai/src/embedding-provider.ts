export type EmbeddingProvider = 'mock' | 'openai';

export function resolveEmbeddingProvider(): EmbeddingProvider {
  const explicit = process.env.AI_EMBEDDING_PROVIDER?.trim().toLowerCase();

  if (explicit === 'mock') {
    return 'mock';
  }

  if (explicit === 'openai') {
    if (!process.env.OPENAI_API_KEY?.trim()) {
      throw new Error('AI_EMBEDDING_PROVIDER=openai requires OPENAI_API_KEY');
    }

    return 'openai';
  }

  if (process.env.OPENAI_API_KEY?.trim()) {
    return 'openai';
  }

  return 'mock';
}

export function getEmbeddingModel(): string {
  return process.env.OPENAI_EMBEDDING_MODEL?.trim() || 'text-embedding-3-small';
}
