export interface LayerCheckResult {
  layer: number;
  passed: boolean;
  reason?: string;
  matchedArticleId?: string;
  similarityScore?: number;
  metadata?: Record<string, unknown>;
}

export interface DuplicateCheckOutcome {
  passed: boolean;
  failedLayer?: number;
  reason?: string;
  matchedArticleId?: string;
  similarityScore?: number;
  layers: LayerCheckResult[];
}

export interface IdeaDuplicateCandidate {
  title: string;
  slugCandidate?: string;
  intent?: string | null;
  normalizedTopicTitle?: string | null;
}

export interface PublishDuplicateCandidate {
  articleId: string;
  title: string;
  slug: string;
  summary?: string | null;
  contentPlain?: string | null;
  intent?: string | null;
}
