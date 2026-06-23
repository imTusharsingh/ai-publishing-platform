import { prisma } from '../src/prisma.service';
import { seed } from '../src/seed';

describe('database seed', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('is idempotent — running twice does not duplicate records', async () => {
    await seed();
    const usersAfterFirst = await prisma.user.count();
    const categoriesAfterFirst = await prisma.category.count();

    await seed();
    const usersAfterSecond = await prisma.user.count();
    const categoriesAfterSecond = await prisma.category.count();

    expect(usersAfterFirst).toBeGreaterThanOrEqual(1);
    expect(categoriesAfterFirst).toBe(7);
    expect(usersAfterSecond).toBe(usersAfterFirst);
    expect(categoriesAfterSecond).toBe(categoriesAfterFirst);
  });

  it('creates the default admin user', async () => {
    const admin = await prisma.user.findUnique({
      where: { email: process.env.SEED_ADMIN_EMAIL ?? 'admin@example.com' },
    });
    expect(admin).not.toBeNull();
    expect(admin?.role).toBe('SUPER_ADMIN');
    expect(admin?.isActive).toBe(true);
  });

  it('creates all default categories', async () => {
    const slugs = [
      'artificial-intelligence',
      'startups',
      'fintech',
      'saas',
      'venture-capital',
      'healthcare',
      'climate-tech',
    ];
    const categories = await prisma.category.findMany({ where: { slug: { in: slugs } } });
    expect(categories).toHaveLength(7);
    expect(categories.every((c) => c.isActive)).toBe(true);
  });
});
