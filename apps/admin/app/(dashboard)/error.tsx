'use client';

import { SystemOfflineView } from '@/components/system-offline-view';

export default function DashboardError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <SystemOfflineView onRetry={reset} />;
}
