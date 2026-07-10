import { Suspense } from 'react';
import { AuditPage } from '@/components/audit-page';

export default function AuditRoute() {
  return (
    <Suspense
      fallback={
        <div className="admin-page ml-0 min-h-screen bg-background p-margin-mobile md:ml-64 md:p-margin-desktop">
          <p className="text-body-sm text-on-surface-variant">Loading audit log…</p>
        </div>
      }
    >
      <AuditPage />
    </Suspense>
  );
}
