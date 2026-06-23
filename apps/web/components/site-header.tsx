import Link from 'next/link';
import { APP_NAME } from '@repo/shared';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur">
      <div className="page-container flex h-16 items-center justify-between">
        <Link href="/" className="text-lg font-bold tracking-tight text-content sm:text-xl">
          {APP_NAME}
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link href="/" className="font-medium text-content">
            Latest
          </Link>
          <span className="hidden text-content-subtle sm:inline">Search</span>
        </nav>
      </div>
    </header>
  );
}
