import { Test, TestingModule } from '@nestjs/testing';
import * as database from '@repo/database';
import { SettingsService } from './settings.service';
import { PrismaService } from '../prisma/prisma.service';

describe('SettingsService', () => {
  let service: SettingsService;
  const prisma = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SettingsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(SettingsService);
    jest.restoreAllMocks();
  });

  it('returns duplicate defaults', () => {
    expect(service.getDuplicateDefaults()).toEqual(database.DEFAULT_DUPLICATE_THRESHOLDS);
  });

  it('delegates getDuplicateSettings to database package', async () => {
    jest
      .spyOn(database, 'getDuplicateSettings')
      .mockResolvedValue(database.DEFAULT_DUPLICATE_THRESHOLDS);

    await expect(service.getDuplicateSettings()).resolves.toEqual(
      database.DEFAULT_DUPLICATE_THRESHOLDS,
    );
    expect(database.getDuplicateSettings).toHaveBeenCalledWith(prisma);
  });

  it('delegates updateDuplicateSettings to database package', async () => {
    jest
      .spyOn(database, 'updateDuplicateSettings')
      .mockResolvedValue(database.DEFAULT_DUPLICATE_THRESHOLDS);

    await expect(
      service.updateDuplicateSettings(database.DEFAULT_DUPLICATE_THRESHOLDS),
    ).resolves.toEqual(database.DEFAULT_DUPLICATE_THRESHOLDS);
    expect(database.updateDuplicateSettings).toHaveBeenCalledWith(
      prisma,
      database.DEFAULT_DUPLICATE_THRESHOLDS,
    );
  });
});
