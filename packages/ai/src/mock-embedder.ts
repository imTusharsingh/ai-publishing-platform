import { createHash } from 'node:crypto';
import { EMBEDDING_DIMENSIONS, normalizeVector } from './vector.util';

export function mockEmbedText(text: string): number[] {
  const hash = createHash('sha256').update(text.trim().toLowerCase()).digest();
  const vector: number[] = [];

  for (let index = 0; index < EMBEDDING_DIMENSIONS; index += 1) {
    const byte = hash[index % hash.length] ?? 0;
    vector.push((byte / 255) * 2 - 1);
  }

  return normalizeVector(vector);
}
