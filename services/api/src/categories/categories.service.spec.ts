import { ConflictException, NotFoundException } from '@nestjs/common';
import { PublishFrequency } from '@prisma/client';
import { CategoriesService } from './categories.service';
import { PrismaService } from '../prisma/prisma.service';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let prisma: {
    category: {
      findMany: jest.Mock;
      count: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  const category = {
    id: 'cat-1',
    name: 'Startups',
    slug: 'startups',
    description: 'Founder stories',
    keywords: ['startups'],
    priorityScore: 80,
    publishFrequency: PublishFrequency.DAILY,
    articlesPerCycle: 1,
    isActive: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  beforeEach(() => {
    prisma = {
      category: {
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    service = new CategoriesService(prisma as unknown as PrismaService);
  });

  it('lists categories with total meta', async () => {
    prisma.category.findMany.mockResolvedValue([category]);
    prisma.category.count.mockResolvedValue(1);

    const result = await service.findAll(true);

    expect(result.meta.total).toBe(1);
    expect(result.data).toHaveLength(1);
    expect(prisma.category.findMany).toHaveBeenCalledWith({
      where: { isActive: true },
      orderBy: [{ priorityScore: 'desc' }, { name: 'asc' }],
    });
  });

  it('returns category by slug with article count', async () => {
    prisma.category.findUnique.mockResolvedValue({
      ...category,
      _count: { articles: 3 },
    });

    const result = await service.findBySlug('startups');

    expect(result.slug).toBe('startups');
    expect(result.articleCount).toBe(3);
  });

  it('creates a category with generated slug', async () => {
    prisma.category.findUnique.mockResolvedValue(null);
    prisma.category.create.mockResolvedValue(category);

    const result = await service.create({
      name: 'Startups',
      description: 'Founder stories',
      keywords: ['startups'],
    });

    expect(result.name).toBe('Startups');
    expect(prisma.category.create).toHaveBeenCalled();
  });

  it('rejects duplicate category names', async () => {
    prisma.category.findUnique.mockResolvedValue(category);

    await expect(service.create({ name: 'Startups' })).rejects.toThrow(ConflictException);
  });

  it('soft-deletes categories that have articles', async () => {
    prisma.category.findUnique.mockResolvedValue({
      ...category,
      _count: { articles: 2 },
    });

    await service.remove('cat-1');

    expect(prisma.category.update).toHaveBeenCalledWith({
      where: { id: 'cat-1' },
      data: { isActive: false },
    });
    expect(prisma.category.delete).not.toHaveBeenCalled();
  });

  it('hard-deletes empty categories', async () => {
    prisma.category.findUnique.mockResolvedValue({
      ...category,
      _count: { articles: 0 },
    });

    await service.remove('cat-1');

    expect(prisma.category.delete).toHaveBeenCalledWith({ where: { id: 'cat-1' } });
  });

  it('throws when category is missing', async () => {
    prisma.category.findUnique.mockResolvedValue(null);

    await expect(service.findBySlug('missing')).rejects.toThrow(NotFoundException);
  });
});
