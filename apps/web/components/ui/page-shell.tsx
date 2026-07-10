import { SiteFooter } from '@/components/site-footer';
import { SiteHeader, type CategoryLink } from '@/components/site-header';

export function PageShell({
  children,
  categories,
}: {
  children: React.ReactNode;
  categories?: CategoryLink[];
}) {
  return (
    <div className="grain-overlay flex min-h-screen flex-col bg-surface">
      <SiteHeader categories={categories} />
      <main className="flex-1">{children}</main>
      <SiteFooter categories={categories} />
    </div>
  );
}
