'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { refreshSession } from '@/lib/api';
import { isAccessTokenExpired } from '@/lib/token';
import { useAuthStore } from '@/stores/auth-store';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const accessToken = useAuthStore((state) => state.accessToken);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function ensureSession() {
      const state = useAuthStore.getState();

      if (!state.accessToken) {
        router.replace('/login');
        return;
      }

      if (state.refreshToken && isAccessTokenExpired(state.accessToken)) {
        try {
          await refreshSession();
        } catch {
          state.clearSession();
          router.replace('/login');
          return;
        }
      }

      setReady(true);
    }

    if (useAuthStore.persist.hasHydrated()) {
      void ensureSession();
      return;
    }

    const unsub = useAuthStore.persist.onFinishHydration(() => {
      void ensureSession();
    });

    return unsub;
  }, [router]);

  if (!ready || !accessToken) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface text-body-sm text-on-surface-variant">
        Checking session…
      </div>
    );
  }

  return <>{children}</>;
}
