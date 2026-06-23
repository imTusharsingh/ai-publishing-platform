import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('database schema', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('connects to PostgreSQL', async () => {
    const result = await prisma.$queryRaw<Array<{ ok: number }>>`SELECT 1 as ok`;
    expect(result[0]?.ok).toBe(1);
  });

  it('has pgvector extension enabled', async () => {
    const result = await prisma.$queryRaw<Array<{ extname: string }>>`
      SELECT extname FROM pg_extension WHERE extname = 'vector'
    `;
    expect(result.length).toBeGreaterThanOrEqual(1);
  });

  it('has all core tables', async () => {
    const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `;
    const names = tables.map((t) => t.tablename);
    const expected = [
      'ai_jobs',
      'article_embeddings',
      'article_ideas',
      'article_related',
      'articles',
      'audit_logs',
      'canonical_topics',
      'categories',
      'duplicate_rejections',
      'publishing_jobs',
      'refresh_tokens',
      'trending_topics',
      'users',
    ];
    for (const table of expected) {
      expect(names).toContain(table);
    }
  });
});
