import type { ArticleImageSuggestion } from './article-ideas.types';

export function escapeArticleHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function parseImageSuggestions(value: unknown): ArticleImageSuggestion[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry): ArticleImageSuggestion | null => {
      if (!entry || typeof entry !== 'object') {
        return null;
      }

      const record = entry as Record<string, unknown>;
      const title = typeof record.title === 'string' ? record.title.trim() : '';
      const description =
        typeof record.description === 'string'
          ? record.description.trim()
          : typeof record.alt === 'string'
            ? record.alt.trim()
            : '';
      if (!description && !title) {
        return null;
      }

      return {
        position: typeof record.position === 'string' ? record.position.trim() : 'in article body',
        type: typeof record.type === 'string' ? record.type.trim() : 'illustration',
        title: title || description,
        description: description || title,
        alt: typeof record.alt === 'string' ? record.alt.trim() : title || description,
        url: typeof record.url === 'string' ? record.url : undefined,
      };
    })
    .filter((item): item is ArticleImageSuggestion => item !== null);
}

export function buildInlineImageFigure(suggestion: ArticleImageSuggestion): string {
  if (!suggestion.url) {
    throw new Error('Inline image figure requires a url');
  }

  const type = suggestion.type?.trim() || 'illustration';
  const alt = suggestion.alt?.trim() || suggestion.description?.trim() || suggestion.title;
  const title = suggestion.title?.trim();

  return `<figure class="article-inline-image" data-type="${escapeArticleHtml(type)}">
<img src="${escapeArticleHtml(suggestion.url)}" alt="${escapeArticleHtml(alt)}" loading="lazy" decoding="async" />
${title ? `<figcaption>${escapeArticleHtml(title)}</figcaption>` : ''}
</figure>`;
}

export function buildIllustrationPlaceholder(
  description: string,
  suggestion?: ArticleImageSuggestion,
  index = 0,
): string {
  if (suggestion?.url) {
    return buildInlineImageFigure(suggestion);
  }

  const label = suggestion?.type?.trim() || 'illustration';
  const title = suggestion?.title?.trim() || `Figure ${index + 1}`;
  const caption = suggestion?.description?.trim() || description;
  const ariaLabel = suggestion?.alt?.trim() || caption;

  return `<figure class="article-illustration" data-type="${escapeArticleHtml(label)}">
<div class="article-illustration-frame" role="img" aria-label="${escapeArticleHtml(ariaLabel)}">
<span class="article-illustration-badge">${escapeArticleHtml(label)}</span>
<p class="article-illustration-description">${escapeArticleHtml(caption)}</p>
</div>
<figcaption>${escapeArticleHtml(title)}</figcaption>
</figure>`;
}

export function countArticleImagePlaceholders(html: string): number {
  const markerMatches = html.match(/\[IMAGE:\s*[^\]]+\]/gi) ?? [];
  const emptyFigureMatches = html.match(/<figure[^>]*>\s*<img(?![^>]*\ssrc\s*=)[^>]*\/?>/gi) ?? [];

  return markerMatches.length + emptyFigureMatches.length;
}

export interface ReplaceArticleImagePlaceholdersOptions {
  /** When true, only replace placeholders that have a generated url. */
  requireUrl?: boolean;
  /** When false, render CSS placeholders for unresolved suggestions (web read path). */
  renderPlaceholders?: boolean;
}

export function replaceArticleImagePlaceholders(
  html: string,
  suggestions: ArticleImageSuggestion[] = [],
  options: ReplaceArticleImagePlaceholdersOptions = {},
): string {
  const { requireUrl = false, renderPlaceholders = true } = options;
  let suggestionIndex = 0;

  const takeSuggestion = (fallbackDescription: string): ArticleImageSuggestion | undefined => {
    const suggestion = suggestions[suggestionIndex];
    suggestionIndex += 1;
    if (suggestion) {
      return suggestion;
    }

    return fallbackDescription
      ? {
          position: 'in article body',
          type: 'illustration',
          title: fallbackDescription,
          description: fallbackDescription,
          alt: fallbackDescription,
        }
      : undefined;
  };

  const renderReplacement = (
    match: string,
    description: string,
    suggestion?: ArticleImageSuggestion,
  ): string => {
    if (!suggestion) {
      return match;
    }

    if (requireUrl && !suggestion.url) {
      return match;
    }

    if (suggestion.url) {
      return buildInlineImageFigure(suggestion);
    }

    if (!renderPlaceholders) {
      return match;
    }

    return buildIllustrationPlaceholder(description, suggestion, suggestionIndex - 1);
  };

  let updated = html.replace(/\[IMAGE:\s*([^\]]+)\]/gi, (match, rawDescription: string) => {
    const description = rawDescription.trim();
    const suggestion = takeSuggestion(description);
    return renderReplacement(match, description, suggestion);
  });

  updated = updated.replace(
    /<figure([^>]*)>\s*<img([^>]*)\/?>\s*(?:<figcaption[^>]*>([\s\S]*?)<\/figcaption>)?\s*<\/figure>/gi,
    (match, _figureAttrs, imgAttrs, figcaption) => {
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
      return renderReplacement(match, description, suggestion);
    },
  );

  return updated;
}
