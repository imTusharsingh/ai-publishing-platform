'use client';

import { useRouter } from 'next/navigation';
import { logout as apiLogout } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';

export function AdminHeader() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const clearSession = useAuthStore((state) => state.clearSession);

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
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">AI Publishing Platform — Admin</h1>
          {user && <p className="text-sm text-gray-500">{user.email}</p>}
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
