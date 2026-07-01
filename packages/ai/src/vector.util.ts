export const EMBEDDING_DIMENSIONS = 1536;

export function vectorToPgLiteral(vector: number[]): string {
  return `[${vector.map((value) => Number(value.toFixed(8))).join(',')}]`;
}

export function normalizeVector(vector: number[]): number[] {
  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
  if (magnitude === 0) {
    return vector;
  }

  return vector.map((value) => value / magnitude);
}
