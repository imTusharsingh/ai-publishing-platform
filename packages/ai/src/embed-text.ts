import { mockEmbedText } from './mock-embedder';
import { openAiEmbedTexts } from './openai-embedder';
import { getEmbeddingModel, resolveEmbeddingProvider } from './embedding-provider';
import type { EmbeddingProvider } from './embedding-provider';

export interface EmbedTextsResult {
  embeddings: number[][];
  provider: EmbeddingProvider;
  model: string;
  tokens: number | null;
}

export async function embedTexts(texts: string[]): Promise<EmbedTextsResult> {
  const provider = resolveEmbeddingProvider();

  if (provider === 'openai') {
    const result = await openAiEmbedTexts(texts);
    return {
      embeddings: result.embeddings,
      provider,
      model: result.model,
      tokens: result.tokens,
    };
  }

  return {
    embeddings: texts.map((text) => mockEmbedText(text)),
    provider: 'mock',
    model: 'mock-embedder-v1',
    tokens: null,
  };
}

export function getDefaultEmbeddingModel(): string {
  const provider = resolveEmbeddingProvider();
  return provider === 'openai' ? getEmbeddingModel() : 'mock-embedder-v1';
}
