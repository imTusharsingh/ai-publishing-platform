'use client';

import Link from 'next/link';

export function SystemOfflineView({
  errorCode = '503_PIPELINE_STALL',
  traceId = 'aura-prod-node-09x-fail',
  onRetry,
}: {
  errorCode?: string;
  traceId?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="admin-page relative flex min-h-screen flex-col overflow-hidden">
      <div className="error-grid-bg pointer-events-none absolute inset-0 -z-10" />
      <div className="flex flex-1 items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-2xl">
          <div className="mb-10 flex flex-col items-center text-center">
            <div className="status-pulse mb-8 flex items-center gap-3 rounded-full bg-error-container px-4 py-2 text-on-error-container">
              <span
                className="material-symbols-outlined text-[18px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                error
              </span>
              <span className="text-label-sm uppercase tracking-widest">Critical Error</span>
            </div>
            <h2 className="mb-4 font-display text-display text-on-surface">
              Neural Engine Offline
            </h2>
            <p className="max-w-lg text-body-lg text-on-surface-variant">
              The automated pipeline has encountered a synchronization failure. Our engineering team
              has been notified and is currently investigating the divergence.
            </p>
          </div>

          <div className="group relative mb-10 overflow-hidden rounded-xl border border-outline-variant bg-surface-container-low p-8 shadow-card">
            <div className="absolute right-0 top-0 p-4">
              <span className="material-symbols-outlined cursor-help text-outline-variant transition-colors group-hover:text-primary">
                terminal
              </span>
            </div>
            <h3 className="mb-4 flex items-center gap-2 text-label-md text-on-surface-variant">
              <span className="h-2 w-2 rounded-full bg-error" />
              Technical Diagnostics
            </h3>
            <div className="space-y-2 rounded-lg border border-outline bg-inverse-surface p-5 font-mono text-sm text-inverse-on-surface">
              <div className="flex justify-between border-b border-outline-variant/20 pb-2">
                <span className="text-surface-variant opacity-70">Error Code:</span>
                <span className="font-bold">{errorCode}</span>
              </div>
              <div className="flex justify-between border-b border-outline-variant/20 py-2">
                <span className="text-surface-variant opacity-70">Last Heartbeat:</span>
                <span className="text-error-container">2m ago</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-surface-variant opacity-70">Trace ID:</span>
                <span className="text-secondary-fixed">{traceId}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-8 py-4 text-label-md text-on-primary shadow-md transition-all hover:opacity-90 active:scale-[0.98] sm:w-auto"
            >
              <span className="material-symbols-outlined">analytics</span>
              Check System Status
            </Link>
            <button
              type="button"
              onClick={onRetry}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-outline-variant bg-surface-container-lowest px-8 py-4 text-label-md text-primary transition-all hover:bg-surface-container-high active:scale-[0.98] sm:w-auto"
            >
              <span className="material-symbols-outlined">refresh</span>
              Retry Connection
            </button>
          </div>
        </div>
      </div>

      <div className="relative h-1 w-full bg-outline-variant/20">
        <div className="absolute h-full w-1/3 bg-primary transition-all duration-1000" />
      </div>
    </div>
  );
}
