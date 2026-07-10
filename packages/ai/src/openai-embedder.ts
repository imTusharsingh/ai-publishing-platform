import OpenAI from 'openai';
import { getEmbeddingModel } from './embedding-provider';

export interface OpenAiEmbedResult {
  embeddings: number[][];
  model: string;
  tokens: number;
}

export async function openAiEmbedTexts(texts: string[]): Promise<OpenAiEmbedResult> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is required for OpenAI embeddings');
  }

  const client = new OpenAI({ apiKey });
  const model = getEmbeddingModel();
  const response = await client.embeddings.create({
    model,
    input: texts,
  });

  return {
    embeddings: response.data.map((item) => item.embedding),
    model,
    tokens: response.usage.total_tokens,
  };
}
