import { AiJobStatus, AiJobType, Prisma, PrismaClient } from '@prisma/client';
import { generateArticleSeo, getPublicSiteBaseUrl } from '@repo/ai';

export interface GenerateArticleSeoResult {
  articleId: string;
  aiJobId: string;
  seoTitle: string;
  seoDescription: string;
}

export async function runArticleSeoEnrichment(
  prisma: PrismaClient,
  articleId: string,
): Promise<GenerateArticleSeoResult> {
  const article = await prisma.article.findUnique({
    where: { id: articleId },
    include: { category: { select: { name: true } } },
  });

  if (!article) {
    throw new Error(`Article with id "${articleId}" not found`);
  }

  const aiJob = await prisma.aiJob.create({
    data: {
      jobType: AiJobType.SEO,
      entityType: 'article',
      entityId: articleId,
      status: AiJobStatus.RUNNING,
      provider: 'pending',
      startedAt: new Date(),
      inputSnapshot: {
        title: article.title,
        slug: article.slug,
        categoryName: article.category.name,
      } as Prisma.InputJsonValue,
    },
  });

  try {
    const seo = await generateArticleSeo({
      title: article.title,
      summary: article.summary,
      contentPlain: article.contentPlain ?? '',
      categoryName: article.category.name,
      slug: article.slug,
      authorName: article.authorName,
      publishedAt: article.publishedAt?.toISOString() ?? null,
      siteBaseUrl: getPublicSiteBaseUrl(),
    });

    const updated = await prisma.article.update({
      where: { id: articleId },
      data: {
        seoTitle: seo.seoTitle,
        seoDescription: seo.seoDescription,
        canonicalUrl: seo.canonicalUrl,
        ogImageUrl: seo.ogImageUrl ?? article.featuredImageUrl,
        structuredData: seo.structuredData as Prisma.InputJsonValue,
      },
    });

    await prisma.aiJob.update({
      where: { id: aiJob.id },
      data: {
        status: AiJobStatus.COMPLETED,
        provider: seo.provider,
        model: seo.model,
        promptTokens: seo.promptTokens,
        completionTokens: seo.completionTokens,
        costUsd: seo.costUsd !== null ? new Prisma.Decimal(seo.costUsd) : undefined,
        completedAt: new Date(),
        outputSnapshot: {
          seoTitle: seo.seoTitle,
          keywordCount: seo.keywords.length,
          canonicalUrl: seo.canonicalUrl,
        } as Prisma.InputJsonValue,
      },
    });

    return {
      articleId: updated.id,
      aiJobId: aiJob.id,
      seoTitle: updated.seoTitle ?? seo.seoTitle,
      seoDescription: updated.seoDescription ?? seo.seoDescription,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'SEO enrichment failed';

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
