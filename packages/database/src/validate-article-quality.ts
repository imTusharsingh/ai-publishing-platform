import { AiJobStatus, AiJobType, Prisma, PrismaClient } from '@prisma/client';
import { validateArticleQuality, type ArticleQualityResult } from '@repo/ai';
import { resolveQualityScoringPrompts } from './prompt-templates';

export interface RunArticleQualityGateResult extends ArticleQualityResult {
  aiJobId: string;
}

export async function runArticleQualityGate(
  prisma: PrismaClient,
  params: {
    articleIdeaId: string;
    title: string;
    summary: string | null;
    contentPlain: string;
    categoryId?: string | null;
  },
): Promise<RunArticleQualityGateResult> {
  const aiJob = await prisma.aiJob.create({
    data: {
      jobType: AiJobType.QUALITY,
      entityType: 'article_idea',
      entityId: params.articleIdeaId,
      status: AiJobStatus.RUNNING,
      provider: 'pending',
      startedAt: new Date(),
      inputSnapshot: {
        title: params.title,
        wordCount: params.contentPlain.split(/\s+/).filter(Boolean).length,
      } as Prisma.InputJsonValue,
    },
  });

  try {
    const prompts = await resolveQualityScoringPrompts(prisma, params.categoryId);

    const quality = await validateArticleQuality({
      title: params.title,
      summary: params.summary,
      contentPlain: params.contentPlain,
      prompts,
    });

    await prisma.aiJob.update({
      where: { id: aiJob.id },
      data: {
        status: quality.passed ? AiJobStatus.COMPLETED : AiJobStatus.FAILED,
        provider: quality.provider,
        model: quality.model,
        promptTokens: quality.promptTokens,
        completionTokens: quality.completionTokens,
        costUsd: quality.costUsd !== null ? new Prisma.Decimal(quality.costUsd) : undefined,
        completedAt: new Date(),
        errorMessage: quality.passed ? null : quality.issues.join('; ') || 'Quality gate failed',
        outputSnapshot: JSON.parse(
          JSON.stringify({
            passed: quality.passed,
            scores: quality.scores,
            issues: quality.issues,
          }),
        ) as Prisma.InputJsonValue,
      },
    });

    if (!quality.passed) {
      throw new Error(quality.issues.join('; ') || 'Article failed quality validation');
    }

    return {
      ...quality,
      aiJobId: aiJob.id,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Quality validation failed';

    await prisma.aiJob.update({
      where: { id: aiJob.id },
      data: {
        status: AiJobStatus.FAILED,
        completedAt: new Date(),
        errorMessage: message,
      },
    });

    throw error instanceof Error ? error : new Error(message);
  }
}
