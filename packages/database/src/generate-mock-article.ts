import {
  AiJobStatus,
  AiJobType,
  ArticleIdeaStatus,
  ArticleStatus,
  Prisma,
  PrismaClient,
} from '@prisma/client';

export interface ArticleOutlineSection {
  heading: string;
  points: string[];
}

export interface GenerateMockArticleResult {
  articleId: string;
  ideaId: string;
  slug: string;
  aiJobId: string;
}

function parseOutline(value: Prisma.JsonValue): ArticleOutlineSection[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value as unknown as ArticleOutlineSection[];
}

export function buildMockArticleContent(
  title: string,
  summary: string | null,
  outline: ArticleOutlineSection[],
): { content: string; contentPlain: string } {
  const intro = summary?.trim() || `This article explores ${title}.`;
  const sections = outline.length
    ? outline
    : [
        {
          heading: 'Overview',
          points: [`Key context for ${title}`, 'What readers should know'],
        },
      ];

  const htmlSections = sections
    .map(
      (section) =>
        `<h2>${section.heading}</h2><ul>${section.points.map((point) => `<li>${point}</li>`).join('')}</ul>`,
    )
    .join('');

  const content = `<h1>${title}</h1><p>${intro}</p>${htmlSections}`;
  const contentPlain = [
    title,
    intro,
    ...sections.flatMap((section) => [section.heading, ...section.points]),
  ].join('\n\n');

  return { content, contentPlain };
}

export async function generateMockArticle(
  prisma: PrismaClient,
  ideaId: string,
): Promise<GenerateMockArticleResult> {
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
      provider: 'mock',
      model: 'mock-writer-v1',
      startedAt: new Date(),
      inputSnapshot: {
        title: idea.title,
        summary: idea.summary,
        outline: idea.outline,
      } as Prisma.InputJsonValue,
    },
  });

  try {
    const outline = parseOutline(idea.outline);
    const { content, contentPlain } = buildMockArticleContent(idea.title, idea.summary, outline);
    const seoTitle = idea.title.slice(0, 70);
    const seoDescription = (idea.summary ?? idea.title).slice(0, 160);

    const article = await prisma.article.create({
      data: {
        categoryId: idea.categoryId,
        articleIdeaId: idea.id,
        title: idea.title,
        slug: idea.slugCandidate,
        summary: idea.summary,
        content,
        contentPlain,
        status: ArticleStatus.DRAFT,
        seoTitle,
        seoDescription,
      },
    });

    await prisma.aiJob.update({
      where: { id: aiJob.id },
      data: {
        status: AiJobStatus.COMPLETED,
        completedAt: new Date(),
        outputSnapshot: {
          articleId: article.id,
          slug: article.slug,
          wordCount: contentPlain.split(/\s+/).length,
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
