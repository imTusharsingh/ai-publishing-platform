import {
  AiJobStatus,
  AiJobType,
  ArticleIdeaStatus,
  ArticleStatus,
  Prisma,
  PrismaClient,
} from '@prisma/client';
import {
  resolveQualityThresholds,
  type ArticleOutlineSection,
  writeArticleContent,
} from '@repo/ai';
import { resolveUniqueArticleSlug, resolveUniqueArticleTitle } from './article-uniqueness.util';
import { runArticleQualityGate } from './validate-article-quality';
import { ensureContentPlanForIdea } from './generate-content-plan';
import { runArticleFeaturedImageEnrichment } from './generate-article-featured-image';
import { runArticleImageSuggestionEnrichment } from './generate-article-image-suggestions';
import { runArticleInlineImageEnrichment } from './generate-article-inline-images';
import { runArticleSeoEnrichment } from './generate-article-seo';
import { resolveArticleWriterPrompts } from './prompt-templates';

export type { ArticleOutlineSection };

export interface GenerateArticleResult {
  articleId: string;
  ideaId: string;
  slug: string;
  aiJobId: string;
  provider: 'mock' | 'openai';
}

export { buildMockArticleContent } from '@repo/ai';

function parseOutline(value: Prisma.JsonValue): ArticleOutlineSection[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value as unknown as ArticleOutlineSection[];
}

const MAX_WRITE_ATTEMPTS = 3;

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function buildWordCountFeedback(wordCount: number, minWordCount: number): string {
  return [
    `The draft is only ${wordCount} words.`,
    `Minimum required: ${minWordCount} words; target 3,000–5,000 words.`,
    'Expand every h2 section with at least three substantive paragraphs.',
    'Add examples, trade-offs, practitioner insight, and image placeholders. Do not shorten existing sections.',
  ].join(' ');
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
    const contentPlan = await ensureContentPlanForIdea(prisma, ideaId);
    const articleTitle = await resolveUniqueArticleTitle(prisma, idea.title);
    const articleSlug = await resolveUniqueArticleSlug(prisma, idea.slugCandidate);
    const writerPrompts = await resolveArticleWriterPrompts(prisma, idea.categoryId);

    const writeInput = {
      title: articleTitle,
      summary: contentPlan.summary ?? idea.summary,
      outline: contentPlan.outline.length > 0 ? contentPlan.outline : parseOutline(idea.outline),
      categoryName: idea.category.name,
      intent: idea.intent,
      prompts: writerPrompts,
    };

    const thresholds = resolveQualityThresholds();
    let writeResult = await writeArticleContent(writeInput);
    let totalPromptTokens = writeResult.promptTokens ?? 0;
    let totalCompletionTokens = writeResult.completionTokens ?? 0;

    for (let attempt = 1; attempt <= MAX_WRITE_ATTEMPTS; attempt += 1) {
      const wordCount = countWords(writeResult.contentPlain);

      if (
        writeResult.provider === 'openai' &&
        wordCount < thresholds.minWordCount &&
        attempt < MAX_WRITE_ATTEMPTS
      ) {
        writeResult = await writeArticleContent({
          ...writeInput,
          qualityFeedback: buildWordCountFeedback(wordCount, thresholds.minWordCount),
        });
        totalPromptTokens += writeResult.promptTokens ?? 0;
        totalCompletionTokens += writeResult.completionTokens ?? 0;
        continue;
      }

      try {
        await runArticleQualityGate(prisma, {
          articleIdeaId: idea.id,
          title: articleTitle,
          summary: writeInput.summary,
          contentPlain: writeResult.contentPlain,
          categoryId: idea.categoryId,
        });
        break;
      } catch (qualityError) {
        if (writeResult.provider !== 'openai' || attempt === MAX_WRITE_ATTEMPTS) {
          throw qualityError;
        }

        const feedback =
          qualityError instanceof Error ? qualityError.message : 'Quality gate failed';

        writeResult = await writeArticleContent({
          ...writeInput,
          qualityFeedback: feedback,
        });
        totalPromptTokens += writeResult.promptTokens ?? 0;
        totalCompletionTokens += writeResult.completionTokens ?? 0;
      }
    }

    const article = await prisma.article.create({
      data: {
        categoryId: idea.categoryId,
        articleIdeaId: idea.id,
        title: articleTitle,
        slug: articleSlug,
        summary: writeInput.summary,
        content: writeResult.content,
        contentPlain: writeResult.contentPlain,
        status: ArticleStatus.DRAFT,
        structuredData:
          contentPlan.imageSuggestions.length > 0
            ? ({
                imageSuggestions: contentPlan.imageSuggestions,
              } as unknown as Prisma.InputJsonValue)
            : undefined,
      },
    });

    try {
      await runArticleImageSuggestionEnrichment(prisma, article.id);
    } catch {
      // Inline image suggestions are optional — article generation should still succeed.
    }

    try {
      await runArticleInlineImageEnrichment(prisma, article.id);
    } catch {
      // Inline image generation is optional — article generation should still succeed.
    }

    await runArticleSeoEnrichment(prisma, article.id);

    try {
      await runArticleFeaturedImageEnrichment(prisma, {
        articleId: article.id,
        slug: article.slug,
        title: articleTitle,
        summary: writeInput.summary,
        categoryName: idea.category.name,
        categoryId: idea.categoryId,
      });
    } catch {
      // Featured image is optional — article generation should still succeed.
    }

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
          wordCount: countWords(writeResult.contentPlain),
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
