import { AiJobStatus, AiJobType, Prisma, PrismaClient } from '@prisma/client';
import { generateContentPlan, type ArticleOutlineSection, type ContentPlan } from '@repo/ai';
import { resolveContentPlanningPrompts } from './prompt-templates';

export interface RunContentPlanningResult {
  ideaId: string;
  aiJobId: string;
  contentPlan: ContentPlan;
}

function parseOutline(value: Prisma.JsonValue | null): ArticleOutlineSection[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value as unknown as ArticleOutlineSection[];
}

function parseContentPlan(value: Prisma.JsonValue | null): ContentPlan | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  const record = value as Record<string, unknown>;
  const summary = typeof record.summary === 'string' ? record.summary : null;
  const outline = parseOutline(record.outline as Prisma.JsonValue);
  if (!summary || outline.length === 0) {
    return null;
  }
  const imageSuggestions = Array.isArray(record.imageSuggestions)
    ? (record.imageSuggestions as ContentPlan['imageSuggestions'])
    : [];
  const narrativeNotes =
    typeof record.narrativeNotes === 'string' ? record.narrativeNotes : undefined;
  return { summary, outline, imageSuggestions, narrativeNotes };
}

export async function ensureContentPlanForIdea(
  prisma: PrismaClient,
  ideaId: string,
): Promise<ContentPlan> {
  const idea = await prisma.articleIdea.findUnique({
    where: { id: ideaId },
    include: { category: { select: { name: true } } },
  });

  if (!idea) {
    throw new Error(`Article idea with id "${ideaId}" not found`);
  }

  const existing = parseContentPlan(idea.contentPlan);
  if (existing) {
    return existing;
  }

  const aiJob = await prisma.aiJob.create({
    data: {
      jobType: AiJobType.PLANNING,
      entityType: 'article_idea',
      entityId: ideaId,
      status: AiJobStatus.RUNNING,
      provider: 'pending',
      startedAt: new Date(),
      inputSnapshot: {
        ideaId,
        title: idea.title,
        phase: 'content_planning',
      } as Prisma.InputJsonValue,
    },
  });

  try {
    const prompts = await resolveContentPlanningPrompts(prisma, idea.categoryId);
    const plan = await generateContentPlan({
      title: idea.title,
      summary: idea.summary,
      outline: parseOutline(idea.outline),
      categoryName: idea.category.name,
      intent: idea.intent,
      prompts,
    });

    const contentPlan: ContentPlan = {
      summary: plan.summary,
      outline: plan.outline,
      imageSuggestions: plan.imageSuggestions,
      narrativeNotes: plan.narrativeNotes,
    };

    await prisma.articleIdea.update({
      where: { id: ideaId },
      data: {
        contentPlan: contentPlan as unknown as Prisma.InputJsonValue,
      },
    });

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
          outlineSections: plan.outline.length,
          imageSuggestionCount: plan.imageSuggestions.length,
        } as Prisma.InputJsonValue,
      },
    });

    return contentPlan;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Content planning failed';

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
