import { Suspense } from 'react';
import { ArticlesPage } from '@/components/articles-page';

export default function ArticlesRoute() {
  return (
    <Suspense
      fallback={
        <div className="admin-page ml-0 min-h-screen bg-background p-margin-mobile md:ml-64 md:p-margin-desktop">
          <p className="text-body-sm text-on-surface-variant">Loading articles…</p>
        </div>
      }
    >
      <ArticlesPage />
    </Suspense>
  );
}
