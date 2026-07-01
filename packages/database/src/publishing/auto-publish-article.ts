import { ArticleStatus, PrismaClient, PublishingJobStatus } from '@prisma/client';
import { checkPrePublishDuplicates } from '../duplicate-engine/check-pre-publish';
import { registerCanonicalTopic } from '../duplicate-engine/register-canonical-topic';
import { runArticleSeoEnrichment } from '../generate-article-seo';

export interface AutoPublishArticleResult {
  publishingJobId: string;
  published: boolean;
  errorMessage?: string;
}

export async function autoPublishArticle(
  prisma: PrismaClient,
  articleId: string,
  options?: { bullmqJobId?: string; scheduledAt?: Date },
): Promise<AutoPublishArticleResult> {
  const scheduledAt = options?.scheduledAt ?? new Date();

  const publishingJob = await prisma.publishingJob.create({
    data: {
      articleId,
      status: PublishingJobStatus.QUEUED,
      scheduledAt,
      bullmqJobId: options?.bullmqJobId ?? null,
    },
  });

  const article = await prisma.article.findUnique({
    where: { id: articleId },
    include: {
      articleIdea: { select: { intent: true } },
    },
  });

  if (!article) {
    const message = `Article with id "${articleId}" not found`;
    await prisma.publishingJob.update({
      where: { id: publishingJob.id },
      data: { status: PublishingJobStatus.FAILED, errorMessage: message },
    });
    return { publishingJobId: publishingJob.id, published: false, errorMessage: message };
  }

  if (!article.content?.trim()) {
    const message = 'Cannot publish an article without content';
    await prisma.publishingJob.update({
      where: { id: publishingJob.id },
      data: { status: PublishingJobStatus.FAILED, errorMessage: message },
    });
    return { publishingJobId: publishingJob.id, published: false, errorMessage: message };
  }

  if (article.status === ArticleStatus.PUBLISHED) {
    await prisma.publishingJob.update({
      where: { id: publishingJob.id },
      data: {
        status: PublishingJobStatus.PUBLISHED,
        publishedAt: article.publishedAt ?? new Date(),
      },
    });
    return { publishingJobId: publishingJob.id, published: true };
  }

  await prisma.publishingJob.update({
    where: { id: publishingJob.id },
    data: { status: PublishingJobStatus.PROCESSING },
  });

  const duplicateCheck = await checkPrePublishDuplicates(prisma, {
    articleId: article.id,
    title: article.title,
    slug: article.slug,
    summary: article.summary,
    contentPlain: article.contentPlain,
    intent: article.articleIdea.intent,
  });

  if (!duplicateCheck.passed) {
    const message = duplicateCheck.reason ?? 'Article rejected by duplicate detection';
    await prisma.publishingJob.update({
      where: { id: publishingJob.id },
      data: { status: PublishingJobStatus.FAILED, errorMessage: message },
    });
    return { publishingJobId: publishingJob.id, published: false, errorMessage: message };
  }

  const publishedAt = new Date();

  await prisma.article.update({
    where: { id: article.id },
    data: {
      status: ArticleStatus.PUBLISHED,
      publishedAt,
    },
  });

  await registerCanonicalTopic(prisma, {
    articleId: article.id,
    title: article.title,
    intent: article.articleIdea.intent,
    summary: article.summary,
  });

  await runArticleSeoEnrichment(prisma, article.id);

  await prisma.publishingJob.update({
    where: { id: publishingJob.id },
    data: {
      status: PublishingJobStatus.PUBLISHED,
      publishedAt,
    },
  });

  return { publishingJobId: publishingJob.id, published: true };
}
