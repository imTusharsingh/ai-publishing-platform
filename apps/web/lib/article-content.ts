/** Strip leading h1 — page header already shows the article title. */
export function prepareArticleHtml(html: string): string {
  return html.replace(/^\s*<h1[^>]*>[\s\S]*?<\/h1>\s*/i, '').trim();
}

export interface ArticleImageSuggestion {
  position?: string;
  type?: string;
  title?: string;
  description?: string;
  alt?: string;
}

const JSON_LD_KEYS = new Set([
  '@context',
  '@type',
  'headline',
  'description',
  'author',
  'publisher',
  'mainEntityOfPage',
  'articleSection',
  'keywords',
  'datePublished',
  'image',
]);

/** SEO JSON-LD only — excludes pipeline metadata like imageSuggestions. */
export function extractArticleJsonLd(
  structuredData: Record<string, unknown> | null | undefined,
): Record<string, unknown> | null {
  if (!structuredData) {
    return null;
  }

  const jsonLd = Object.fromEntries(
    Object.entries(structuredData).filter(([key]) => JSON_LD_KEYS.has(key)),
  );

  return Object.keys(jsonLd).length > 0 ? jsonLd : null;
}

export function parseImageSuggestionsFromStructuredData(
  structuredData: Record<string, unknown> | null | undefined,
): ArticleImageSuggestion[] {
  if (!structuredData || !Array.isArray(structuredData.imageSuggestions)) {
    return [];
  }

  return structuredData.imageSuggestions
    .map((entry) => {
      if (!entry || typeof entry !== 'object') {
        return null;
      }
      const record = entry as Record<string, unknown>;
      const description =
        typeof record.description === 'string'
          ? record.description.trim()
          : typeof record.alt === 'string'
            ? record.alt.trim()
            : '';
      if (!description) {
        return null;
      }
      return {
        position: typeof record.position === 'string' ? record.position : undefined,
        type: typeof record.type === 'string' ? record.type : undefined,
        title: typeof record.title === 'string' ? record.title : undefined,
        description,
        alt: typeof record.alt === 'string' ? record.alt : description,
      };
    })
    .filter((item): item is ArticleImageSuggestion => item !== null);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildIllustrationPlaceholder(
  description: string,
  suggestion?: ArticleImageSuggestion,
  index = 0,
): string {
  const label = suggestion?.type?.trim() || 'illustration';
  const title = suggestion?.title?.trim() || `Figure ${index + 1}`;
  const caption = suggestion?.description?.trim() || description;
  const ariaLabel = suggestion?.alt?.trim() || caption;

  return `<figure class="article-illustration" data-type="${escapeHtml(label)}">
<div class="article-illustration-frame" role="img" aria-label="${escapeHtml(ariaLabel)}">
<span class="article-illustration-badge">${escapeHtml(label)}</span>
<p class="article-illustration-description">${escapeHtml(caption)}</p>
</div>
<figcaption>${escapeHtml(title)}</figcaption>
</figure>`;
}

/**
 * Turn writer placeholders into styled editorial illustration blocks.
 * Uses imageSuggestions from content planning when available (by order).
 */
export function enrichArticleHtmlWithImages(
  html: string,
  suggestions: ArticleImageSuggestion[] = [],
): string {
  let suggestionIndex = 0;

  const takeSuggestion = (fallbackDescription: string): ArticleImageSuggestion | undefined => {
    const suggestion = suggestions[suggestionIndex];
    suggestionIndex += 1;
    if (suggestion) {
      return suggestion;
    }
    return fallbackDescription
      ? { description: fallbackDescription, alt: fallbackDescription }
      : undefined;
  };

  let enriched = html.replace(/\[IMAGE:\s*([^\]]+)\]/gi, (_match, rawDescription: string) => {
    const description = rawDescription.trim();
    const suggestion = takeSuggestion(description);
    return buildIllustrationPlaceholder(description, suggestion, suggestionIndex - 1);
  });

  enriched = enriched.replace(
    /<figure([^>]*)>\s*<img([^>]*)\/?>\s*(?:<figcaption[^>]*>([\s\S]*?)<\/figcaption>)?\s*<\/figure>/gi,
    (match, figureAttrs, imgAttrs, figcaption) => {
      const hasSrc = /src\s*=\s*["'][^"']+["']/i.test(imgAttrs);
      if (hasSrc) {
        return match;
      }

      const altMatch = imgAttrs.match(/alt\s*=\s*["']([^"']*)["']/i);
      const description = (altMatch?.[1] || figcaption || '').replace(/<[^>]+>/g, '').trim();
      if (!description) {
        return match;
      }

      const suggestion = takeSuggestion(description);
      return buildIllustrationPlaceholder(description, suggestion, suggestionIndex - 1);
    },
  );

  return enriched;
}

export function isHtmlContent(content: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(content);
}

export interface ArticleHeading {
  id: string;
  text: string;
  level: 2 | 3;
}

function slugifyHeading(text: string): string {
  const slug =
    text
      .toLowerCase()
      .replace(/&[^;]+;/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'section';

  return slug;
}

export function injectHeadingIds(html: string): { html: string; headings: ArticleHeading[] } {
  const headings: ArticleHeading[] = [];
  const usedIds = new Map<string, number>();

  const htmlWithIds = html.replace(
    /<h([23])([^>]*)>([\s\S]*?)<\/h\1>/gi,
    (match, level, attrs, inner) => {
      const text = inner.replace(/<[^>]+>/g, '').trim();
      if (!text) {
        return match;
      }

      if (/id\s*=/.test(attrs)) {
        const idMatch = attrs.match(/id\s*=\s*["']([^"']+)["']/i);
        if (idMatch?.[1]) {
          headings.push({ id: idMatch[1], text, level: Number(level) as 2 | 3 });
        }
        return match;
      }

      const baseId = slugifyHeading(text);
      const count = usedIds.get(baseId) ?? 0;
      usedIds.set(baseId, count + 1);
      const id = count === 0 ? baseId : `${baseId}-${count + 1}`;

      headings.push({ id, text, level: Number(level) as 2 | 3 });
      return `<h${level}${attrs} id="${id}">${inner}</h${level}>`;
    },
  );

  return { html: htmlWithIds, headings };
}

export function countWords(text: string): number {
  const plain = text
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!plain) {
    return 0;
  }
  return plain.split(/\s+/).filter(Boolean).length;
}

export function estimateReadingMinutes(wordCount: number, wordsPerMinute = 220): number {
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
}
