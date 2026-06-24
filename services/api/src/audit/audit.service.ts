import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogListResponse, AuditLogResponse } from './audit.types';
import { ListAuditLogsQueryDto } from './dto/list-audit-logs-query.dto';

export interface CreateAuditLogInput {
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  ipAddress?: string;
  userAgent?: string;
  payload?: Prisma.InputJsonValue;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(input: CreateAuditLogInput): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        userId: input.userId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        payload: input.payload,
      },
    });
  }

  async findAll(query: ListAuditLogsQueryDto): Promise<AuditLogListResponse> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where = query.entityType ? { entityType: query.entityType } : undefined;

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: { user: { select: { email: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data: logs.map((log) => this.toResponse(log)),
      meta: { total, page, limit },
    };
  }

  private toResponse(log: {
    id: string;
    userId: string | null;
    action: string;
    entityType: string;
    entityId: string | null;
    ipAddress: string | null;
    userAgent: string | null;
    payload: Prisma.JsonValue;
    createdAt: Date;
    user: { email: string } | null;
  }): AuditLogResponse {
    return {
      id: log.id,
      userId: log.userId,
      userEmail: log.user?.email ?? null,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      payload: log.payload as Record<string, unknown> | null,
      createdAt: log.createdAt,
    };
  }
}
