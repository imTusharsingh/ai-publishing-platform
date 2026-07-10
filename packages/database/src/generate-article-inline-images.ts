import { Prisma, PrismaClient } from '@prisma/client';
import { generateInlineImage } from '@repo/ai';
import type { ArticleImageSuggestion } from '@repo/shared';
import { saveInlineArticleMediaFile } from './article-media';

export interface GenerateArticleInlineImagesResult {
  articleId: string;
  imageCount: number;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function parseImageSuggestions(value: unknown): ArticleImageSuggestion[] {
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

export function countArticleImagePlaceholders(html: string): number {
  const markerMatches = html.match(/\[IMAGE:\s*[^\]]+\]/gi) ?? [];
  const emptyFigureMatches = html.match(/<figure[^>]*>\s*<img(?![^>]*\ssrc\s*=)[^>]*\/?>/gi) ?? [];

  return markerMatches.length + emptyFigureMatches.length;
}

export function buildInlineImageFigure(suggestion: ArticleImageSuggestion): string {
  if (!suggestion.url) {
    throw new Error('Inline image figure requires a url');
  }

  const type = suggestion.type?.trim() || 'illustration';
  const alt = suggestion.alt?.trim() || suggestion.description?.trim() || suggestion.title;
  const title = suggestion.title?.trim();

  return `<figure class="article-inline-image" data-type="${escapeHtml(type)}">
<img src="${escapeHtml(suggestion.url)}" alt="${escapeHtml(alt)}" loading="lazy" decoding="async" />
${title ? `<figcaption>${escapeHtml(title)}</figcaption>` : ''}
</figure>`;
}

export function materializeInlineImagesInHtml(
  html: string,
  suggestions: ArticleImageSuggestion[],
): string {
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

  let updated = html.replace(/\[IMAGE:\s*([^\]]+)\]/gi, (_match, rawDescription: string) => {
    const description = rawDescription.trim();
    const suggestion = takeSuggestion(description);
    if (!suggestion?.url) {
      return _match;
    }

    return buildInlineImageFigure(suggestion);
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
      if (!suggestion?.url) {
        return match;
      }

      return buildInlineImageFigure(suggestion);
    },
  );

  return updated;
}

function stripImagePlaceholdersFromPlain(contentPlain: string): string {
  return contentPlain
    .replace(/\[IMAGE:\s*[^\]]+\]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function runArticleInlineImageEnrichment(
  prisma: PrismaClient,
  articleId: string,
): Promise<GenerateArticleInlineImagesResult | null> {
  const article = await prisma.article.findUnique({
    where: { id: articleId },
    include: { category: { select: { name: true } } },
  });

  if (!article?.content?.trim()) {
    return null;
  }

  const placeholderCount = countArticleImagePlaceholders(article.content);
  if (placeholderCount === 0) {
    return null;
  }

  const existingStructured =
    article.structuredData && typeof article.structuredData === 'object'
      ? (article.structuredData as Record<string, unknown>)
      : {};

  const suggestions = parseImageSuggestions(existingStructured.imageSuggestions);
  const updatedSuggestions: ArticleImageSuggestion[] = [...suggestions];
  let generatedCount = 0;

  for (let index = 0; index < placeholderCount; index += 1) {
    const existing = updatedSuggestions[index];
    if (existing?.url) {
      continue;
    }

    const fallbackDescription = `Editorial illustration ${index + 1} for ${article.title}`;
    const suggestion: ArticleImageSuggestion = existing ?? {
      position: 'in article body',
      type: 'illustration',
      title: fallbackDescription,
      description: fallbackDescription,
      alt: fallbackDescription,
    };

    const image = await generateInlineImage({
      slug: article.slug,
      index,
      categoryName: article.category.name,
      suggestion,
    });

    const url = await saveInlineArticleMediaFile(article.slug, index, image.data, image.extension);

    updatedSuggestions[index] = {
      ...suggestion,
      url,
    };
    generatedCount += 1;
  }

  if (generatedCount === 0 && !updatedSuggestions.some((item) => item.url)) {
    return null;
  }

  const updatedContent = materializeInlineImagesInHtml(article.content, updatedSuggestions);
  const updatedContentPlain = stripImagePlaceholdersFromPlain(
    updatedContent
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim(),
  );

  await prisma.article.update({
    where: { id: articleId },
    data: {
      content: updatedContent,
      contentPlain: updatedContentPlain,
      structuredData: {
        ...existingStructured,
        imageSuggestions: updatedSuggestions,
      } as unknown as Prisma.InputJsonValue,
    },
  });

  return {
    articleId,
    imageCount: generatedCount,
  };
}
