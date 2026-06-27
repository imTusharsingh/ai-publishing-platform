import { ArticleIdeaStatus, ArticleStatus } from '@prisma/client';
import { buildMockArticleContent, generateMockArticle } from '../src/generate-mock-article';

describe('generateMockArticle', () => {
  const prisma = {
    articleIdea: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    aiJob: {
      create: jest.fn(),
      update: jest.fn(),
    },
    article: {
      create: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('builds html and plain content from outline', () => {
    const result = buildMockArticleContent('Test title', 'Summary text', [
      { heading: 'Section', points: ['Point A'] },
    ]);

    expect(result.content).toContain('<h1>Test title</h1>');
    expect(result.content).toContain('<h2>Section</h2>');
    expect(result.contentPlain).toContain('Point A');
  });

  it('creates draft article and completes ai job', async () => {
    prisma.articleIdea.findUnique.mockResolvedValue({
      id: 'idea-1',
      categoryId: 'cat-1',
      title: 'Generated article',
      slugCandidate: 'generated-article',
      summary: 'Summary',
      outline: [{ heading: 'Intro', points: ['Point'] }],
      status: ArticleIdeaStatus.GENERATING,
      article: null,
      category: { id: 'cat-1', name: 'Tech' },
    });
    prisma.aiJob.create.mockResolvedValue({ id: 'ai-job-1' });
    prisma.article.create.mockResolvedValue({
      id: 'article-1',
      slug: 'generated-article',
    });
    prisma.aiJob.update.mockResolvedValue({});
    prisma.articleIdea.update.mockResolvedValue({});

    const result = await generateMockArticle(prisma as never, 'idea-1');

    expect(result).toEqual({
      articleId: 'article-1',
      ideaId: 'idea-1',
      slug: 'generated-article',
      aiJobId: 'ai-job-1',
      provider: 'mock',
    });
    expect(prisma.article.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: ArticleStatus.DRAFT,
          slug: 'generated-article',
        }),
      }),
    );
  });
});
