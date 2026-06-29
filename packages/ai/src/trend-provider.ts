import type { TrendDiscoveryProvider } from './types';

export function resolveTrendDiscoveryProvider(): TrendDiscoveryProvider {
  const explicit = process.env.TREND_DISCOVERY_PROVIDER?.trim().toLowerCase();

  if (explicit === 'mock' || explicit === 'live' || explicit === 'auto') {
    return explicit;
  }

  return 'auto';
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
