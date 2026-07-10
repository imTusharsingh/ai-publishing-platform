import { AiJobStatus, AiJobType, Prisma, PrismaClient } from '@prisma/client';
import { generateArticleImageSuggestionsWithOpenAI, resolveAiProvider } from '@repo/ai';
import { resolveArticleImageSuggestionPrompts } from './prompt-templates';

export interface GenerateArticleImageSuggestionsResult {
  articleId: string;
  imageCount: number;
  aiJobId: string;
}

export async function runArticleImageSuggestionEnrichment(
  prisma: PrismaClient,
  articleId: string,
): Promise<GenerateArticleImageSuggestionsResult | null> {
  if (resolveAiProvider() !== 'openai') {
    return null;
  }

  const article = await prisma.article.findUnique({
    where: { id: articleId },
    include: { category: { select: { name: true } } },
  });

  if (!article?.contentPlain?.trim()) {
    return null;
  }

  const existingStructured =
    article.structuredData && typeof article.structuredData === 'object'
      ? (article.structuredData as Record<string, unknown>)
      : {};

  if (Array.isArray(existingStructured.imageSuggestions)) {
    return null;
  }

  const aiJob = await prisma.aiJob.create({
    data: {
      jobType: AiJobType.PLANNING,
      entityType: 'article',
      entityId: articleId,
      status: AiJobStatus.RUNNING,
      provider: 'pending',
      startedAt: new Date(),
      inputSnapshot: {
        articleId,
        title: article.title,
      } as Prisma.InputJsonValue,
    },
  });

  try {
    const prompts = await resolveArticleImageSuggestionPrompts(prisma, article.categoryId);
    const result = await generateArticleImageSuggestionsWithOpenAI({
      title: article.title,
      summary: article.summary,
      categoryName: article.category.name,
      contentPlain: article.contentPlain,
      prompts,
    });

    if (result.images.length === 0) {
      throw new Error('Image suggestion generation returned no images');
    }

    await prisma.article.update({
      where: { id: articleId },
      data: {
        structuredData: {
          ...existingStructured,
          imageSuggestions: result.images,
        } as unknown as Prisma.InputJsonValue,
      },
    });

    await prisma.aiJob.update({
      where: { id: aiJob.id },
      data: {
        status: AiJobStatus.COMPLETED,
        provider: result.provider,
        model: result.model,
        promptTokens: result.promptTokens,
        completionTokens: result.completionTokens,
        costUsd: result.costUsd !== null ? new Prisma.Decimal(result.costUsd) : undefined,
        completedAt: new Date(),
        outputSnapshot: {
          imageCount: result.images.length,
        } as Prisma.InputJsonValue,
      },
    });

    return {
      articleId,
      imageCount: result.images.length,
      aiJobId: aiJob.id,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Image suggestion generation failed';

    await prisma.aiJob.update({
      where: { id: aiJob.id },
      data: {
        status: AiJobStatus.FAILED,
        completedAt: new Date(),
        errorMessage: message,
      },
    });

    throw error;
  }
}
