import { AiJobStatus, AiJobType, Prisma, PrismaClient } from '@prisma/client';
import { embedTexts, getDefaultEmbeddingModel } from '@repo/ai';
import { vectorToPgLiteral } from './embedding-similarity';

export interface GenerateArticleEmbeddingsResult {
  articleId: string;
  aiJobId: string;
  model: string;
  provider: string;
}

export async function generateArticleEmbeddings(
  prisma: PrismaClient,
  articleId: string,
): Promise<GenerateArticleEmbeddingsResult> {
  const article = await prisma.article.findUnique({
    where: { id: articleId },
    select: {
      id: true,
      title: true,
      summary: true,
      contentPlain: true,
    },
  });

  if (!article) {
    throw new Error(`Article with id "${articleId}" not found`);
  }

  const aiJob = await prisma.aiJob.create({
    data: {
      jobType: AiJobType.EMBEDDING,
      entityType: 'article',
      entityId: articleId,
      status: AiJobStatus.RUNNING,
      provider: 'pending',
      startedAt: new Date(),
      inputSnapshot: {
        title: article.title,
        hasSummary: Boolean(article.summary?.trim()),
        hasContent: Boolean(article.contentPlain?.trim()),
      } as Prisma.InputJsonValue,
    },
  });

  try {
    const titleText = article.title.trim();
    const summaryText = article.summary?.trim() || titleText;
    const contentText = article.contentPlain?.trim() || summaryText;

    const embedResult = await embedTexts([titleText, summaryText, contentText]);
    const [titleEmbedding, summaryEmbedding, contentEmbedding] = embedResult.embeddings;

    const titleVector = vectorToPgLiteral(titleEmbedding);
    const summaryVector = vectorToPgLiteral(summaryEmbedding);
    const contentVector = vectorToPgLiteral(contentEmbedding);

    await prisma.$executeRawUnsafe(
      `
      INSERT INTO article_embeddings (
        id, article_id, title_embedding, summary_embedding, content_embedding, model
      )
      VALUES (gen_random_uuid(), $1::uuid, $2::vector, $3::vector, $4::vector, $5)
      ON CONFLICT (article_id) DO UPDATE SET
        title_embedding = EXCLUDED.title_embedding,
        summary_embedding = EXCLUDED.summary_embedding,
        content_embedding = EXCLUDED.content_embedding,
        model = EXCLUDED.model
      `,
      articleId,
      titleVector,
      summaryVector,
      contentVector,
      embedResult.model,
    );

    await prisma.aiJob.update({
      where: { id: aiJob.id },
      data: {
        status: AiJobStatus.COMPLETED,
        provider: embedResult.provider,
        model: embedResult.model,
        promptTokens: embedResult.tokens,
        completedAt: new Date(),
        outputSnapshot: {
          articleId,
          model: embedResult.model,
          provider: embedResult.provider,
        } as Prisma.InputJsonValue,
      },
    });

    return {
      articleId,
      aiJobId: aiJob.id,
      model: embedResult.model,
      provider: embedResult.provider,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Embedding generation failed';

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

export async function embedCandidateTexts(texts: {
  title: string;
  summary?: string | null;
  contentPlain?: string | null;
}): Promise<{ titleEmbedding: number[]; summaryEmbedding: number[]; contentEmbedding: number[] }> {
  const titleText = texts.title.trim();
  const summaryText = texts.summary?.trim() || titleText;
  const contentText = texts.contentPlain?.trim() || summaryText;
  const result = await embedTexts([titleText, summaryText, contentText]);
  const [titleEmbedding, summaryEmbedding, contentEmbedding] = result.embeddings;

  return { titleEmbedding, summaryEmbedding, contentEmbedding };
}

export function getEmbeddingModelName(): string {
  return getDefaultEmbeddingModel();
}
