import {
  resolveUniqueArticleSlug,
  resolveUniqueArticleTitle,
} from '../src/article-uniqueness.util';

describe('article uniqueness helpers', () => {
  const prisma = {
    article: {
      findFirst: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns base title when unused', async () => {
    prisma.article.findFirst.mockResolvedValue(null);

    const title = await resolveUniqueArticleTitle(prisma as never, 'Fresh title');

    expect(title).toBe('Fresh title');
  });

  it('suffixes title when taken', async () => {
    prisma.article.findFirst.mockResolvedValueOnce({ id: 'existing' }).mockResolvedValueOnce(null);

    const title = await resolveUniqueArticleTitle(prisma as never, 'Duplicate title');

    expect(title).toBe('Duplicate title (2)');
  });

  it('suffixes slug when taken', async () => {
    prisma.article.findFirst.mockResolvedValueOnce({ id: 'existing' }).mockResolvedValueOnce(null);

    const slug = await resolveUniqueArticleSlug(prisma as never, 'duplicate-slug');

    expect(slug).toBe('duplicate-slug-2');
  });
});
