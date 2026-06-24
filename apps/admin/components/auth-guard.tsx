'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const accessToken = useAuthStore((state) => state.accessToken);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const persisted = useAuthStore.persist.hasHydrated();
    if (persisted) {
      setReady(true);
      if (!useAuthStore.getState().accessToken) {
        router.replace('/login');
      }
      return;
    }

    const unsub = useAuthStore.persist.onFinishHydration(() => {
      setReady(true);
      if (!useAuthStore.getState().accessToken) {
        router.replace('/login');
      }
    });

    return unsub;
  }, [router]);

  if (!ready || !accessToken) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 text-sm text-gray-500">
        Checking session…
      </div>
    );
  }

  return <>{children}</>;
}
