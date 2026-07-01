'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ADMIN_APP_NAME } from '@repo/shared';
import { logout as apiLogout } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { cn } from '@/lib/cn';

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: 'dashboard' },
  { href: '/categories', label: 'Categories', icon: 'category' },
  { href: '/topics', label: 'Topics', icon: 'topic' },
  { href: '/ideas', label: 'Ideas', icon: 'lightbulb' },
  { href: '/articles', label: 'Articles', icon: 'description' },
  { href: '/jobs', label: 'AI Jobs', icon: 'robot_2' },
  { href: '/audit', label: 'Audit Log', icon: 'history' },
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const clearSession = useAuthStore((state) => state.clearSession);

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? 'AU';

  const handleLogout = async () => {
    if (refreshToken) {
      try {
        await apiLogout(refreshToken);
      } catch {
        // Clear local session even if API logout fails
      }
    }
    clearSession();
    router.replace('/login');
  };

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-full w-64 flex-col border-r border-outline-variant bg-surface-container p-stack-md shadow-card">
      <div className="mb-stack-lg px-2 pt-2">
        <h1 className="font-display text-headline-sm font-bold text-primary">{ADMIN_APP_NAME}</h1>
        <p className="mt-1 flex items-center gap-2 text-body-sm text-on-surface-variant">
          <span className="h-2 w-2 animate-pulse rounded-full bg-secondary" />
          AI Pipeline Active
        </p>
      </div>

      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-4 py-3 transition-all',
                active
                  ? 'bg-primary font-bold text-on-primary shadow-md'
                  : 'text-on-surface-variant hover:bg-surface-container-high',
              )}
            >
              <span
                className="material-symbols-outlined"
                style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {item.icon}
              </span>
              <span className="text-label-md">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-outline-variant pt-stack-md">
        <Link
          href="/articles"
          className="mb-stack-md flex w-full items-center justify-center gap-2 rounded-lg bg-primary-container py-3 text-label-md text-on-primary-container transition-opacity hover:opacity-90"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          New Article
        </Link>

        <div className="mb-4 flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary bg-primary-container font-bold text-label-md text-on-primary-container">
            {initials}
          </div>
          <div className="min-w-0 overflow-hidden">
            <p className="truncate text-label-md text-on-surface">
              {user?.email?.split('@')[0] ?? 'Admin User'}
            </p>
            <p className="truncate text-body-sm text-on-surface-variant">
              {user?.email ?? 'admin@auranews.ai'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-4 py-2 text-on-surface-variant transition-all hover:bg-surface-container-high"
        >
          <span className="material-symbols-outlined">logout</span>
          <span className="text-label-md">Logout</span>
        </button>
      </div>
    </aside>
  );
}
