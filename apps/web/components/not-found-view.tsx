import Link from 'next/link';
import type { ArticleSummary } from '@repo/shared';
import { ArticleCard } from '@/components/article-card';
import { PageShell } from '@/components/ui/page-shell';

export function NotFoundView({ recommended = [] }: { recommended?: ArticleSummary[] }) {
  return (
    <PageShell>
      <main className="relative flex flex-grow flex-col overflow-hidden">
        <div className="grain-overlay pointer-events-none absolute inset-0" />
        <section className="relative z-10 flex flex-col items-center justify-center px-margin-mobile pb-12 pt-24 text-center md:px-margin-desktop">
          <div className="relative mb-8">
            <span className="select-none font-display text-[120px] font-black leading-none tracking-tighter text-primary opacity-5 md:text-[180px]">
              404
            </span>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex h-24 w-24 animate-pulse items-center justify-center rounded-full border border-primary/20 md:h-32 md:w-32">
                <span
                  className="material-symbols-outlined text-5xl text-primary md:text-6xl"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  cloud_off
                </span>
              </div>
            </div>
          </div>
          <h1 className="mb-4 font-display text-headline-lg tracking-tight text-primary md:text-[40px]">
            The signal has been lost.
          </h1>
          <p className="mx-auto mb-10 max-w-lg text-body-lg text-on-surface-variant">
            The article you&apos;re looking for doesn&apos;t exist or has been moved by our neural
            engine.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/"
              className="flex items-center justify-center gap-2 rounded-xl bg-primary px-8 py-3 text-label-md text-on-primary transition-all hover:opacity-90 active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-[20px]">home</span>
              Return to Homepage
            </Link>
          </div>
        </section>

        {recommended.length > 0 && (
          <section className="relative z-10 mx-auto w-full max-w-container-max px-margin-mobile py-16 md:px-margin-desktop">
            <div className="mb-8 flex items-center justify-between border-b border-outline-variant pb-4">
              <h2 className="font-display text-headline-sm text-on-surface">Recommended for You</h2>
              <Link
                href="/"
                className="flex items-center gap-1 text-label-md text-primary hover:underline"
              >
                View Archive
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-gutter md:grid-cols-3">
              {recommended.slice(0, 3).map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </section>
        )}
      </main>
    </PageShell>
  );
}
