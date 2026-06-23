import Link from 'next/link';
import { APP_NAME } from '@repo/shared';

export function SiteHeader() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-xl font-bold text-gray-900">
          {APP_NAME}
        </Link>
        <nav className="flex gap-6 text-sm text-gray-600">
          <Link href="/" className="hover:text-gray-900">
            Latest
          </Link>
          <span className="text-gray-400">Categories</span>
          <span className="text-gray-400">Search</span>
        </nav>
      </div>
    </header>
  );
}
