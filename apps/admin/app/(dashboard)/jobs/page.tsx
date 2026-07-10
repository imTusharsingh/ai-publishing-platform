import { Suspense } from 'react';
import { JobsPage } from '@/components/jobs-page';

export default function JobsRoute() {
  return (
    <Suspense
      fallback={
        <div className="admin-page ml-0 min-h-screen bg-background p-margin-mobile md:ml-64 md:p-margin-desktop">
          <p className="text-body-sm text-on-surface-variant">Loading jobs…</p>
        </div>
      }
    >
      <JobsPage />
    </Suspense>
  );
}
