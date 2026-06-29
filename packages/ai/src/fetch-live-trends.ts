import type { DiscoveredTrendCandidate, TrendDiscoveryCategoryInput } from './types';

const USER_AGENT =
  'ai-publishing-platform/1.0 (+https://github.com/imTusharsingh/ai-publishing-platform)';

interface RawTrend {
  source: DiscoveredTrendCandidate['source'];
  title: string;
  description: string;
  popularityScore: number;
  sourceUrl: string;
}

export async function fetchHackerNewsTrends(keywords: string[], limit = 6): Promise<RawTrend[]> {
  const query = keywords.slice(0, 4).join(' ');
  const url = new URL('https://hn.algolia.com/api/v1/search');
  url.searchParams.set('query', query || 'technology');
  url.searchParams.set('tags', 'story');
  url.searchParams.set('hitsPerPage', String(limit));

  const response = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT },
  });

  if (!response.ok) {
    return [];
  }

  const data = (await response.json()) as {
    hits?: Array<{
      title?: string;
      url?: string;
      points?: number;
      num_comments?: number;
      objectID?: string;
    }>;
  };

  return (data.hits ?? [])
    .filter((hit) => hit.title?.trim())
    .map((hit) => ({
      source: 'BLOG_RSS',
      title: hit.title!.trim(),
      description: `${hit.points ?? 0} points · ${hit.num_comments ?? 0} comments on Hacker News`,
      popularityScore: Math.min(100, Number(hit.points ?? 0)),
      sourceUrl: hit.url?.trim() || `https://news.ycombinator.com/item?id=${hit.objectID}`,
    }));
}

export async function fetchRedditTrends(limit = 6): Promise<RawTrend[]> {
  const subreddits = ['technology', 'artificial', 'startups'];
  const results: RawTrend[] = [];

  for (const subreddit of subreddits) {
    const url = `https://www.reddit.com/r/${subreddit}/hot.json?limit=${Math.ceil(limit / subreddits.length)}`;
    const response = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
    });

    if (!response.ok) {
      continue;
    }

    const data = (await response.json()) as {
      data?: {
        children?: Array<{
          data?: {
            title?: string;
            selftext?: string;
            score?: number;
            num_comments?: number;
            permalink?: string;
          };
        }>;
      };
    };

    for (const child of data.data?.children ?? []) {
      const post = child.data;
      if (!post?.title?.trim()) {
        continue;
      }

      const description =
        post.selftext?.trim().slice(0, 240) ||
        `${post.score ?? 0} upvotes · ${post.num_comments ?? 0} comments on r/${subreddit}`;

      results.push({
        source: 'REDDIT',
        title: post.title.trim(),
        description,
        popularityScore: Math.min(100, Number(post.score ?? 0)),
        sourceUrl: `https://www.reddit.com${post.permalink ?? ''}`,
      });
    }
  }

  return results;
}

export async function fetchNewsApiTrends(keywords: string[], limit = 6): Promise<RawTrend[]> {
  const apiKey = process.env.NEWS_API_KEY?.trim();
  if (!apiKey) {
    return [];
  }

  const query = keywords.slice(0, 3).join(' OR ') || 'technology';
  const url = new URL('https://newsapi.org/v2/everything');
  url.searchParams.set('q', query);
  url.searchParams.set('language', 'en');
  url.searchParams.set('sortBy', 'popularity');
  url.searchParams.set('pageSize', String(limit));

  const response = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      'X-Api-Key': apiKey,
    },
  });

  if (!response.ok) {
    return [];
  }

  const data = (await response.json()) as {
    articles?: Array<{
      title?: string;
      description?: string;
      url?: string;
      source?: { name?: string };
    }>;
  };

  return (data.articles ?? [])
    .filter((article) => article.title?.trim() && article.url?.trim())
    .map((article, index) => ({
      source: 'NEWS_API',
      title: article.title!.trim(),
      description:
        article.description?.trim().slice(0, 240) ||
        `Headline from ${article.source?.name ?? 'NewsAPI'}`,
      popularityScore: Math.max(40, 100 - index * 5),
      sourceUrl: article.url!.trim(),
    }));
}

export async function fetchLiveTrendCandidates(
  categories: TrendDiscoveryCategoryInput[],
  maxTopics: number,
): Promise<{ trends: RawTrend[]; sources: string[] }> {
  const keywords = categories.flatMap((category) => category.keywords);
  const perSource = Math.max(3, Math.ceil(maxTopics / 3));
  const sources: string[] = [];
  const batches = await Promise.all([
    fetchHackerNewsTrends(keywords, perSource),
    fetchRedditTrends(perSource),
    fetchNewsApiTrends(keywords, perSource),
  ]);

  const combined: RawTrend[] = [];

  if (batches[0].length > 0) {
    sources.push('hackernews');
    combined.push(...batches[0]);
  }

  if (batches[1].length > 0) {
    sources.push('reddit');
    combined.push(...batches[1]);
  }

  if (batches[2].length > 0) {
    sources.push('newsapi');
    combined.push(...batches[2]);
  }

  const deduped = dedupeTrends(combined)
    .sort((a, b) => b.popularityScore - a.popularityScore)
    .slice(0, maxTopics);

  return { trends: deduped, sources };
}

function dedupeTrends(trends: RawTrend[]): RawTrend[] {
  const seen = new Set<string>();
  const result: RawTrend[] = [];

  for (const trend of trends) {
    const key = trend.title.toLowerCase().replace(/\s+/g, ' ').trim();
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(trend);
  }

  return result;
}
