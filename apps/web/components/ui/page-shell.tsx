import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';

type CategoryLink = { name: string; slug: string };

export function PageShell({
  children,
  categories,
}: {
  children: React.ReactNode;
  categories?: CategoryLink[];
}) {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <SiteHeader categories={categories} />
      <main className="flex-1 py-stack-lg">{children}</main>
      <SiteFooter categories={categories} />
    </div>
  );
}
