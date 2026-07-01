import { Prisma, PrismaClient } from '@prisma/client';

export const DUPLICATE_SETTINGS_KEY = 'duplicate_thresholds';

export interface DuplicateThresholdSettings {
  titleThreshold: number;
  summaryThreshold: number;
  contentThreshold: number;
  topicCooldownDays: number;
  clusterDistanceThreshold: number;
}

export const DEFAULT_DUPLICATE_THRESHOLDS: DuplicateThresholdSettings = {
  titleThreshold: 0.92,
  summaryThreshold: 0.88,
  contentThreshold: 0.85,
  topicCooldownDays: 30,
  clusterDistanceThreshold: 0.15,
};

function parseThresholds(value: unknown): DuplicateThresholdSettings {
  if (!value || typeof value !== 'object') {
    return DEFAULT_DUPLICATE_THRESHOLDS;
  }

  const record = value as Record<string, unknown>;
  return {
    titleThreshold: Number(record.titleThreshold ?? DEFAULT_DUPLICATE_THRESHOLDS.titleThreshold),
    summaryThreshold: Number(
      record.summaryThreshold ?? DEFAULT_DUPLICATE_THRESHOLDS.summaryThreshold,
    ),
    contentThreshold: Number(
      record.contentThreshold ?? DEFAULT_DUPLICATE_THRESHOLDS.contentThreshold,
    ),
    topicCooldownDays: Number(
      record.topicCooldownDays ?? DEFAULT_DUPLICATE_THRESHOLDS.topicCooldownDays,
    ),
    clusterDistanceThreshold: Number(
      record.clusterDistanceThreshold ?? DEFAULT_DUPLICATE_THRESHOLDS.clusterDistanceThreshold,
    ),
  };
}

export async function getDuplicateSettings(
  prisma: PrismaClient,
): Promise<DuplicateThresholdSettings> {
  const row = await prisma.platformSetting.findUnique({
    where: { key: DUPLICATE_SETTINGS_KEY },
  });

  if (!row) {
    return DEFAULT_DUPLICATE_THRESHOLDS;
  }

  return parseThresholds(row.value);
}

export async function updateDuplicateSettings(
  prisma: PrismaClient,
  settings: DuplicateThresholdSettings,
): Promise<DuplicateThresholdSettings> {
  const value = {
    titleThreshold: settings.titleThreshold,
    summaryThreshold: settings.summaryThreshold,
    contentThreshold: settings.contentThreshold,
    topicCooldownDays: settings.topicCooldownDays,
    clusterDistanceThreshold: settings.clusterDistanceThreshold,
  } satisfies DuplicateThresholdSettings;

  const row = await prisma.platformSetting.upsert({
    where: { key: DUPLICATE_SETTINGS_KEY },
    create: {
      key: DUPLICATE_SETTINGS_KEY,
      value: value as Prisma.InputJsonValue,
    },
    update: {
      value: value as Prisma.InputJsonValue,
    },
  });

  return parseThresholds(row.value);
}
