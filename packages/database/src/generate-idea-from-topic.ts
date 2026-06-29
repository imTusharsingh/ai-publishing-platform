import {
  AiJobStatus,
  AiJobType,
  ArticleIdeaStatus,
  Prisma,
  PrismaClient,
  TopicStatus,
} from '@prisma/client';
import { generateIdeaContent } from '@repo/ai';
import { resolveUniqueIdeaSlug } from './idea-slug.util';

export interface GenerateIdeaFromTopicResult {
  ideaId: string;
  aiJobId: string;
  provider: string;
}

export async function generateArticleIdeaFromTopic(
  prisma: PrismaClient,
  topicId: string,
): Promise<GenerateIdeaFromTopicResult> {
  const topic = await prisma.trendingTopic.findUnique({
    where: { id: topicId },
    include: { matchedCategory: { select: { id: true, name: true } } },
  });

  if (!topic) {
    throw new Error(`Topic with id "${topicId}" not found`);
  }

  if (!topic.matchedCategoryId || !topic.matchedCategory) {
    throw new Error('Topic has no matched category for idea generation');
  }

  const aiJob = await prisma.aiJob.create({
    data: {
      jobType: AiJobType.PLANNING,
      entityType: 'trending_topic',
      entityId: topicId,
      status: AiJobStatus.RUNNING,
      provider: 'pending',
      startedAt: new Date(),
      inputSnapshot: {
        topicTitle: topic.title,
        topicDescription: topic.description,
        categoryName: topic.matchedCategory.name,
      } as Prisma.InputJsonValue,
    },
  });

  try {
    const plan = await generateIdeaContent({
      topicTitle: topic.title,
      topicDescription: topic.description,
      categoryName: topic.matchedCategory.name,
    });

    const slugCandidate = await resolveUniqueIdeaSlug(prisma, plan.title);

    const idea = await prisma.articleIdea.create({
      data: {
        categoryId: topic.matchedCategoryId,
        trendingTopicId: topic.id,
        title: plan.title,
        slugCandidate,
        summary: plan.summary,
        outline: plan.outline as unknown as Prisma.InputJsonValue,
        intent: plan.intent,
        status: ArticleIdeaStatus.DRAFT,
      },
    });

    if (topic.status === TopicStatus.DISCOVERED || topic.status === TopicStatus.SUGGESTED) {
      await prisma.trendingTopic.update({
        where: { id: topic.id },
        data: { status: TopicStatus.USED },
      });
    }

    await prisma.aiJob.update({
      where: { id: aiJob.id },
      data: {
        status: AiJobStatus.COMPLETED,
        provider: plan.provider,
        model: plan.model,
        promptTokens: plan.promptTokens,
        completionTokens: plan.completionTokens,
        costUsd: plan.costUsd !== null ? new Prisma.Decimal(plan.costUsd) : undefined,
        completedAt: new Date(),
        outputSnapshot: {
          ideaId: idea.id,
          title: plan.title,
          outlineSections: plan.outline.length,
          provider: plan.provider,
          model: plan.model,
        } as Prisma.InputJsonValue,
      },
    });

    return {
      ideaId: idea.id,
      aiJobId: aiJob.id,
      provider: plan.provider,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Idea generation failed';

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
