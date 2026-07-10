import type { TrendDiscoveryProvider } from './types';

export function resolveTrendDiscoveryProvider(): TrendDiscoveryProvider {
  const explicit = process.env.TREND_DISCOVERY_PROVIDER?.trim().toLowerCase();

  if (explicit === 'mock' || explicit === 'live' || explicit === 'auto' || explicit === 'openai') {
    return explicit;
  }

  return 'auto';
}

export function isOpenAiTrendDiscoveryAvailable(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export function getTrendDiscoveryMaxTopics(): number {
  const raw = process.env.TREND_DISCOVERY_MAX_TOPICS?.trim();
  if (!raw) {
    return 12;
  }

  const value = Number.parseInt(raw, 10);
  if (Number.isNaN(value) || value < 1 || value > 50) {
    return 12;
  }

  return value;
}
