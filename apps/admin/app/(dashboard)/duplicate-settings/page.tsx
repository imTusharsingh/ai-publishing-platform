import { Suspense } from 'react';
import { DuplicateSettingsPage } from '@/components/duplicate-settings-page';

export default function DuplicateSettingsRoute() {
  return (
    <Suspense
      fallback={
        <div className="admin-page ml-0 min-h-screen bg-background p-margin-mobile md:ml-64 md:p-margin-desktop">
          <p className="text-body-sm text-on-surface-variant">Loading duplicate settings…</p>
        </div>
      }
    >
      <DuplicateSettingsPage />
    </Suspense>
  );
}
