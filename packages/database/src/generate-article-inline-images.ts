import { Prisma, PrismaClient } from '@prisma/client';
import { generateInlineImage } from '@repo/ai';
import {
  countArticleImagePlaceholders,
  parseImageSuggestions,
  replaceArticleImagePlaceholders,
  type ArticleImageSuggestion,
} from '@repo/shared';
import { saveInlineArticleMediaFile } from './article-media';

export {
  buildInlineImageFigure,
  countArticleImagePlaceholders,
  materializeInlineImagesInHtml,
} from './article-inline-images.util';

export interface GenerateArticleInlineImagesResult {
  articleId: string;
  imageCount: number;
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

  const updatedContent = replaceArticleImagePlaceholders(article.content, updatedSuggestions, {
    requireUrl: true,
    renderPlaceholders: false,
  });
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
