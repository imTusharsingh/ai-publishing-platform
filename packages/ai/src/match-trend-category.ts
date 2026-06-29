import type { TrendDiscoveryCategoryInput } from './types';

export function matchTrendToCategory(
  title: string,
  description: string,
  categories: TrendDiscoveryCategoryInput[],
): string | null {
  if (categories.length === 0) {
    return null;
  }

  const text = `${title} ${description}`.toLowerCase();
  let best: { id: string; score: number; priority: number } | null = null;

  for (const category of categories) {
    const keywordHits = category.keywords.filter((keyword) =>
      text.includes(keyword.toLowerCase()),
    ).length;

    if (keywordHits === 0) {
      continue;
    }

    const candidate = {
      id: category.id,
      score: keywordHits,
      priority: category.priorityScore,
    };

    if (
      !best ||
      candidate.score > best.score ||
      (candidate.score === best.score && candidate.priority > best.priority)
    ) {
      best = candidate;
    }
  }

  if (best) {
    return best.id;
  }

  const fallback = categories.slice().sort((a, b) => b.priorityScore - a.priorityScore)[0];

  return fallback?.id ?? null;
}
