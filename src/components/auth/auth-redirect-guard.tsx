'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getRoleDashboardPath, isAppRole } from '@/lib/auth/roles';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

export function AuthRedirectGuard() {
  const router = useRouter();

  useEffect(() => {
    async function redirectIfAuthenticated() {
      if (!isSupabaseConfigured) return;

      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle<{ role: unknown }>();

        if (isAppRole(profile?.role)) {
          router.replace(getRoleDashboardPath(profile.role));
        }
      } catch {
        // Server-side guards still handle the canonical auth redirect.
      }
    }

    void redirectIfAuthenticated();
    window.addEventListener('pageshow', redirectIfAuthenticated);
    return () => window.removeEventListener('pageshow', redirectIfAuthenticated);
  }, [router]);

  return null;
}
