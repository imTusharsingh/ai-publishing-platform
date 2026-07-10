import type { ArticleImageSuggestion } from '@repo/shared';
import { buildInlineImageFigure, replaceArticleImagePlaceholders } from '@repo/shared';

export { countArticleImagePlaceholders } from '@repo/shared';

export function materializeInlineImagesInHtml(
  html: string,
  suggestions: ArticleImageSuggestion[],
): string {
  return replaceArticleImagePlaceholders(html, suggestions, {
    requireUrl: true,
    renderPlaceholders: false,
  });
}

export { buildInlineImageFigure };
