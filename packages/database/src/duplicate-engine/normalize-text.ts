export function normalizeText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function buildTopicKey(title: string, intent?: string | null): string {
  const normalizedTitle = normalizeText(title);
  const normalizedIntent = intent?.trim().toLowerCase() || 'general';
  return `${normalizedIntent}::${normalizedTitle}`.slice(0, 200);
}

export function slugifyCandidate(title: string): string {
  return normalizeText(title).replace(/\s+/g, '-').slice(0, 520);
}
