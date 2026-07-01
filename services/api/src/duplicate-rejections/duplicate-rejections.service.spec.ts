import { Test, TestingModule } from '@nestjs/testing';
import { DuplicateRejectionsService } from './duplicate-rejections.service';
import { PrismaService } from '../prisma/prisma.service';

describe('DuplicateRejectionsService', () => {
  let service: DuplicateRejectionsService;

  const prisma = {
    duplicateRejection: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DuplicateRejectionsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(DuplicateRejectionsService);
    jest.clearAllMocks();
  });

  it('returns paginated duplicate rejections', async () => {
    const result = await service.findAll({ page: 1, limit: 10 });
    expect(result.meta).toEqual({ total: 0, page: 1, limit: 10 });
    expect(result.data).toEqual([]);
  });
});
