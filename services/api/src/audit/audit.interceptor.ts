import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Observable, tap } from 'rxjs';
import { AuthUser } from '../auth/auth.types';
import { AuditService } from './audit.service';

interface AuditRequest {
  method: string;
  user?: AuthUser;
  ip?: string;
  headers: Record<string, string | string[] | undefined>;
  params: Record<string, string>;
  route?: { path?: string };
  originalUrl?: string;
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<AuditRequest>();
    const method = request.method.toUpperCase();

    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return next.handle();
    }

    return next.handle().pipe(
      tap((responseBody) => {
        const user = request.user;
        if (!user) {
          return;
        }

        const mapping = this.resolveMapping(request, responseBody);
        if (!mapping) {
          return;
        }

        void this.auditService.log({
          userId: user.id,
          action: mapping.action,
          entityType: mapping.entityType,
          entityId: mapping.entityId,
          ipAddress: request.ip,
          userAgent: this.getUserAgent(request),
          payload: mapping.payload as Prisma.InputJsonValue | undefined,
        });
      }),
    );
  }

  private resolveMapping(
    request: AuditRequest,
    responseBody: unknown,
  ): {
    action: string;
    entityType: string;
    entityId?: string;
    payload?: Record<string, unknown>;
  } | null {
    const path = request.route?.path ?? request.originalUrl ?? '';
    const method = request.method.toUpperCase();

    if (path.includes('/article-ideas')) {
      const entityId =
        request.params.id ??
        request.params.topicId ??
        (typeof responseBody === 'object' &&
        responseBody !== null &&
        'id' in responseBody &&
        typeof (responseBody as { id: unknown }).id === 'string'
          ? (responseBody as { id: string }).id
          : undefined);

      let action = 'article_idea.update';
      if (method === 'POST' && path.includes('/from-topic/')) {
        action = 'article_idea.generate_from_topic';
      } else if (method === 'POST' && path.includes('/generate')) {
        action = 'article_idea.enqueue_generation';
      } else if (method === 'POST') {
        action = 'article_idea.create';
      } else if (path.includes('/status')) {
        action = 'article_idea.status_update';
      }

      return {
        action,
        entityType: 'article_idea',
        entityId,
        payload:
          typeof responseBody === 'object' && responseBody !== null
            ? (responseBody as Record<string, unknown>)
            : undefined,
      };
    }

    if (path.includes('/admin/articles')) {
      const entityId = request.params.id;

      return {
        action: 'article.status_update',
        entityType: 'article',
        entityId,
        payload:
          typeof responseBody === 'object' && responseBody !== null
            ? (responseBody as Record<string, unknown>)
            : undefined,
      };
    }

    if (path.includes('/categories')) {
      const entityId =
        request.params.id ??
        (typeof responseBody === 'object' &&
        responseBody !== null &&
        'id' in responseBody &&
        typeof (responseBody as { id: unknown }).id === 'string'
          ? (responseBody as { id: string }).id
          : undefined);

      const action =
        method === 'POST'
          ? 'category.create'
          : method === 'DELETE'
            ? 'category.delete'
            : 'category.update';

      return {
        action,
        entityType: 'category',
        entityId,
        payload:
          typeof responseBody === 'object' && responseBody !== null
            ? (responseBody as Record<string, unknown>)
            : undefined,
      };
    }

    return null;
  }

  private getUserAgent(request: AuditRequest): string | undefined {
    const value = request.headers['user-agent'];
    return typeof value === 'string' ? value : undefined;
  }
}
