import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from './audit.service';

describe('AuditService', () => {
  let service: AuditService;
  const prisma = {
    auditLog: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get(AuditService);
  });

  it('creates audit log entries', async () => {
    prisma.auditLog.create.mockResolvedValue({ id: 'log-1' });

    await service.log({
      userId: 'user-1',
      action: 'category.create',
      entityType: 'category',
      entityId: 'cat-1',
    });

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-1',
        action: 'category.create',
        entityType: 'category',
        entityId: 'cat-1',
      }),
    });
  });

  it('returns paginated audit logs', async () => {
    prisma.auditLog.findMany.mockResolvedValue([
      {
        id: 'log-1',
        userId: 'user-1',
        action: 'category.create',
        entityType: 'category',
        entityId: 'cat-1',
        ipAddress: null,
        userAgent: null,
        payload: null,
        createdAt: new Date('2025-01-01T00:00:00.000Z'),
        user: { email: 'admin@example.com' },
      },
    ]);
    prisma.auditLog.count.mockResolvedValue(1);

    const result = await service.findAll({ page: 1, limit: 20 });

    expect(result.meta).toEqual({ total: 1, page: 1, limit: 20 });
    expect(result.data[0]?.userEmail).toBe('admin@example.com');
  });
});
