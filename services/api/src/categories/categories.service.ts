import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CategoryListResponse, CategoryResponse } from './categories.types';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { generateUniqueSlug, slugify } from './slug.util';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(activeOnly = false): Promise<CategoryListResponse> {
    const where = activeOnly ? { isActive: true } : undefined;
    const [categories, total] = await Promise.all([
      this.prisma.category.findMany({
        where,
        orderBy: [{ priorityScore: 'desc' }, { name: 'asc' }],
      }),
      this.prisma.category.count({ where }),
    ]);

    return {
      data: categories.map((category) => this.toResponse(category)),
      meta: { total },
    };
  }

  async findBySlug(slug: string): Promise<CategoryResponse> {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: { _count: { select: { articles: true } } },
    });

    if (!category) {
      throw new NotFoundException(`Category with slug "${slug}" not found`);
    }

    return this.toResponse(category, category._count.articles);
  }

  async create(dto: CreateCategoryDto): Promise<CategoryResponse> {
    await this.ensureUniqueName(dto.name);

    const slug = await generateUniqueSlug(dto.name, async (candidate) => {
      const existing = await this.prisma.category.findUnique({ where: { slug: candidate } });
      return existing !== null;
    });

    const category = await this.prisma.category.create({
      data: {
        name: dto.name,
        slug,
        description: dto.description,
        keywords: dto.keywords ?? [],
        priorityScore: dto.priorityScore ?? 50,
        publishFrequency: dto.publishFrequency,
        articlesPerCycle: dto.articlesPerCycle ?? 1,
        isActive: dto.isActive ?? true,
      },
    });

    return this.toResponse(category);
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<CategoryResponse> {
    const existing = await this.prisma.category.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Category with id "${id}" not found`);
    }

    if (dto.name && dto.name !== existing.name) {
      await this.ensureUniqueName(dto.name, id);
    }

    const data: Prisma.CategoryUpdateInput = {};

    if (dto.description !== undefined) data.description = dto.description;
    if (dto.keywords !== undefined) data.keywords = dto.keywords;
    if (dto.priorityScore !== undefined) data.priorityScore = dto.priorityScore;
    if (dto.publishFrequency !== undefined) data.publishFrequency = dto.publishFrequency;
    if (dto.articlesPerCycle !== undefined) data.articlesPerCycle = dto.articlesPerCycle;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;

    if (dto.name) {
      data.name = dto.name;
      data.slug = await generateUniqueSlug(dto.name, async (candidate) => {
        const match = await this.prisma.category.findUnique({ where: { slug: candidate } });
        return match !== null && match.id !== id;
      });
    }

    const category = await this.prisma.category.update({
      where: { id },
      data,
    });

    return this.toResponse(category);
  }

  async remove(id: string): Promise<void> {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { articles: true } } },
    });

    if (!category) {
      throw new NotFoundException(`Category with id "${id}" not found`);
    }

    if (category._count.articles > 0) {
      await this.prisma.category.update({
        where: { id },
        data: { isActive: false },
      });
      return;
    }

    await this.prisma.category.delete({ where: { id } });
  }

  private async ensureUniqueName(name: string, excludeId?: string): Promise<void> {
    const existing = await this.prisma.category.findUnique({ where: { name } });
    if (existing && existing.id !== excludeId) {
      throw new ConflictException(`Category with name "${name}" already exists`);
    }
  }

  private toResponse(
    category: {
      id: string;
      name: string;
      slug: string;
      description: string | null;
      keywords: string[];
      priorityScore: number;
      publishFrequency: CategoryResponse['publishFrequency'];
      articlesPerCycle: number;
      isActive: boolean;
      createdAt: Date;
      updatedAt: Date;
    },
    articleCount?: number,
  ): CategoryResponse {
    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      keywords: category.keywords,
      priorityScore: category.priorityScore,
      publishFrequency: category.publishFrequency,
      articlesPerCycle: category.articlesPerCycle,
      isActive: category.isActive,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
      ...(articleCount !== undefined ? { articleCount } : {}),
    };
  }
}

export { slugify };
