import {
  AiJobStatus,
  AiJobType,
  ArticleIdeaStatus,
  ArticleStatus,
  Prisma,
  PrismaClient,
} from '@prisma/client';
import { writeArticleContent, type ArticleOutlineSection } from '@repo/ai';
import { resolveUniqueArticleSlug, resolveUniqueArticleTitle } from './article-uniqueness.util';
import { runArticleQualityGate } from './validate-article-quality';

export type { ArticleOutlineSection };

export interface GenerateArticleResult {
  articleId: string;
  ideaId: string;
  slug: string;
  aiJobId: string;
  provider: 'mock' | 'openai';
}

/** @deprecated Use GenerateArticleResult */
export type GenerateMockArticleResult = GenerateArticleResult;

function parseOutline(value: Prisma.JsonValue): ArticleOutlineSection[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value as unknown as ArticleOutlineSection[];
}

export async function generateArticle(
  prisma: PrismaClient,
  ideaId: string,
): Promise<GenerateArticleResult> {
  const idea = await prisma.articleIdea.findUnique({
    where: { id: ideaId },
    include: {
      article: { select: { id: true } },
      category: { select: { id: true, name: true } },
    },
  });

  if (!idea) {
    throw new Error(`Article idea with id "${ideaId}" not found`);
  }

  if (idea.article) {
    throw new Error(`Article already exists for idea "${ideaId}"`);
  }

  if (idea.status !== ArticleIdeaStatus.GENERATING && idea.status !== ArticleIdeaStatus.APPROVED) {
    throw new Error(`Idea "${ideaId}" is not eligible for generation (status: ${idea.status})`);
  }

  const aiJob = await prisma.aiJob.create({
    data: {
      jobType: AiJobType.WRITING,
      entityType: 'article_idea',
      entityId: ideaId,
      status: AiJobStatus.RUNNING,
      provider: 'pending',
      startedAt: new Date(),
      inputSnapshot: {
        title: idea.title,
        summary: idea.summary,
        outline: idea.outline,
        categoryName: idea.category.name,
      } as Prisma.InputJsonValue,
    },
  });

  try {
    const articleTitle = await resolveUniqueArticleTitle(prisma, idea.title);
    const articleSlug = await resolveUniqueArticleSlug(prisma, idea.slugCandidate);

    const writeInput = {
      title: articleTitle,
      summary: idea.summary,
      outline: parseOutline(idea.outline),
      categoryName: idea.category.name,
      intent: idea.intent,
    };

    let writeResult = await writeArticleContent(writeInput);
    let totalPromptTokens = writeResult.promptTokens ?? 0;
    let totalCompletionTokens = writeResult.completionTokens ?? 0;

    try {
      await runArticleQualityGate(prisma, {
        articleIdeaId: idea.id,
        title: articleTitle,
        summary: idea.summary,
        contentPlain: writeResult.contentPlain,
      });
    } catch (qualityError) {
      if (writeResult.provider !== 'openai') {
        throw qualityError;
      }

      const feedback = qualityError instanceof Error ? qualityError.message : 'Quality gate failed';

      writeResult = await writeArticleContent({
        ...writeInput,
        qualityFeedback: feedback,
      });
      totalPromptTokens += writeResult.promptTokens ?? 0;
      totalCompletionTokens += writeResult.completionTokens ?? 0;

      await runArticleQualityGate(prisma, {
        articleIdeaId: idea.id,
        title: articleTitle,
        summary: idea.summary,
        contentPlain: writeResult.contentPlain,
      });
    }

    const seoTitle = articleTitle.slice(0, 70);
    const seoDescription = (idea.summary ?? articleTitle).slice(0, 160);

    const article = await prisma.article.create({
      data: {
        categoryId: idea.categoryId,
        articleIdeaId: idea.id,
        title: articleTitle,
        slug: articleSlug,
        summary: idea.summary,
        content: writeResult.content,
        contentPlain: writeResult.contentPlain,
        status: ArticleStatus.DRAFT,
        seoTitle,
        seoDescription,
      },
    });

    await prisma.aiJob.update({
      where: { id: aiJob.id },
      data: {
        status: AiJobStatus.COMPLETED,
        provider: writeResult.provider,
        model: writeResult.model,
        promptTokens: totalPromptTokens || writeResult.promptTokens,
        completionTokens: totalCompletionTokens || writeResult.completionTokens,
        costUsd: writeResult.costUsd !== null ? new Prisma.Decimal(writeResult.costUsd) : undefined,
        completedAt: new Date(),
        outputSnapshot: {
          articleId: article.id,
          slug: article.slug,
          wordCount: writeResult.contentPlain.split(/\s+/).filter(Boolean).length,
          provider: writeResult.provider,
          model: writeResult.model,
        } as Prisma.InputJsonValue,
      },
    });

    await prisma.articleIdea.update({
      where: { id: ideaId },
      data: { status: ArticleIdeaStatus.APPROVED },
    });

    return {
      articleId: article.id,
      ideaId: idea.id,
      slug: article.slug,
      aiJobId: aiJob.id,
      provider: writeResult.provider,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Article generation failed';

    await prisma.aiJob.update({
      where: { id: aiJob.id },
      data: {
        status: AiJobStatus.FAILED,
        completedAt: new Date(),
        errorMessage: message,
      },
    });

    await prisma.articleIdea.update({
      where: { id: ideaId },
      data: { status: ArticleIdeaStatus.FAILED },
    });

    throw error;
  }
}

/** @deprecated Use generateArticle */
export const generateMockArticle = generateArticle;
