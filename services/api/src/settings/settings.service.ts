import { Injectable } from '@nestjs/common';
import {
  DEFAULT_DUPLICATE_THRESHOLDS,
  getDuplicateSettings,
  updateDuplicateSettings,
  type DuplicateThresholdSettings,
} from '@repo/database';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDuplicateSettings(): Promise<DuplicateThresholdSettings> {
    return getDuplicateSettings(this.prisma);
  }

  async updateDuplicateSettings(
    settings: DuplicateThresholdSettings,
  ): Promise<DuplicateThresholdSettings> {
    return updateDuplicateSettings(this.prisma, {
      titleThreshold: settings.titleThreshold,
      summaryThreshold: settings.summaryThreshold,
      contentThreshold: settings.contentThreshold,
      topicCooldownDays: settings.topicCooldownDays,
      clusterDistanceThreshold: settings.clusterDistanceThreshold,
    });
  }

  getDuplicateDefaults(): DuplicateThresholdSettings {
    return DEFAULT_DUPLICATE_THRESHOLDS;
  }
}
