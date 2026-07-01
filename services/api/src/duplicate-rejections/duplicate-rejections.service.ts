import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ListDuplicateRejectionsQueryDto } from './dto/list-duplicate-rejections-query.dto';

export interface DuplicateRejectionResponse {
  id: string;
  rejectedTitle: string;
  rejectedAt: string;
  layer: number;
  matchedArticleId: string | null;
  matchedArticleTitle: string | null;
  similarityScore: number | null;
  reason: string | null;
  metadata: Record<string, unknown> | null;
}

export interface DuplicateRejectionListResponse {
  data: DuplicateRejectionResponse[];
  meta: { total: number; page: number; limit: number };
}

@Injectable()
export class DuplicateRejectionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ListDuplicateRejectionsQueryDto): Promise<DuplicateRejectionListResponse> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.DuplicateRejectionWhereInput = {};
    if (query.layer !== undefined) {
      where.layer = query.layer;
    }

    const [rows, total] = await Promise.all([
      this.prisma.duplicateRejection.findMany({
        where,
        include: {
          matchedArticle: { select: { id: true, title: true } },
        },
        orderBy: { rejectedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.duplicateRejection.count({ where }),
    ]);

    return {
      data: rows.map((row) => ({
        id: row.id,
        rejectedTitle: row.rejectedTitle,
        rejectedAt: row.rejectedAt.toISOString(),
        layer: row.layer,
        matchedArticleId: row.matchedArticleId,
        matchedArticleTitle: row.matchedArticle?.title ?? null,
        similarityScore: row.similarityScore ? Number(row.similarityScore) : null,
        reason: row.reason,
        metadata: (row.metadata as Record<string, unknown> | null) ?? null,
      })),
      meta: { total, page, limit },
    };
  }
}
