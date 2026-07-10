import { Suspense } from 'react';
import { ArticleIdeasPage } from '@/components/article-ideas-page';

export default function IdeasRoute() {
  return (
    <Suspense
      fallback={
        <div className="admin-page ml-0 min-h-screen bg-background p-margin-mobile md:ml-64 md:p-margin-desktop">
          <p className="text-body-sm text-on-surface-variant">Loading ideas…</p>
        </div>
      }
    >
      <ArticleIdeasPage />
    </Suspense>
  );
}
