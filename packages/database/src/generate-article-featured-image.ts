import { PrismaClient } from '@prisma/client';
import { generateFeaturedImage } from '@repo/ai';
import { resolveFeaturedImagePrompt } from './prompt-templates';
import { saveArticleMediaFile } from './article-media';

export interface GenerateArticleFeaturedImageResult {
  articleId: string;
  featuredImageUrl: string;
  provider: 'mock' | 'openai';
}

export async function runArticleFeaturedImageEnrichment(
  prisma: PrismaClient,
  input: {
    articleId: string;
    slug: string;
    title: string;
    summary: string | null;
    categoryName: string;
    categoryId: string;
  },
): Promise<GenerateArticleFeaturedImageResult | null> {
  const existing = await prisma.article.findUnique({
    where: { id: input.articleId },
    select: { featuredImageUrl: true },
  });

  if (!existing) {
    throw new Error(`Article with id "${input.articleId}" not found`);
  }

  if (existing.featuredImageUrl) {
    return null;
  }

  const imagePrompt = await resolveFeaturedImagePrompt(
    prisma,
    {
      title: input.title,
      summary: input.summary ?? '',
      categoryName: input.categoryName,
      slug: input.slug,
    },
    input.categoryId,
  );

  const image = await generateFeaturedImage(
    {
      title: input.title,
      summary: input.summary,
      categoryName: input.categoryName,
      slug: input.slug,
    },
    { prompt: imagePrompt },
  );

  const featuredImageUrl = await saveArticleMediaFile(input.slug, image.data, image.extension);

  await prisma.article.update({
    where: { id: input.articleId },
    data: { featuredImageUrl },
  });

  return {
    articleId: input.articleId,
    featuredImageUrl,
    provider: image.provider,
  };
}
