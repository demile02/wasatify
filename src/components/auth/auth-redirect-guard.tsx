'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getRoleDashboardPath, isAppRole } from '@/lib/auth/roles';

export function AuthRedirectGuard() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;
    async function redirectIfAuthenticated() {
      if (pathname === '/register/confirmation' || pathname === '/reset-password') return;
      try {
        const { createClient, isSupabaseConfigured } = await import('@/lib/supabase/client');
        if (!isSupabaseConfigured) return;
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user || cancelled) return;

        const { data: profile } = await supabase
          .from('profiles')
          .select('role, class_id')
          .eq('id', user.id)
          .maybeSingle<{ role: unknown; class_id: string | null }>();

        if (!cancelled && isAppRole(profile?.role)) {
          if (profile.role === 'student' && !profile.class_id) {
            const isStudentCompletionPath = pathname === '/register/student/complete';
            const isGoogleTeacherCompletionPath =
              pathname === '/register/teacher/complete' && user.app_metadata.provider === 'google';
            if (!isStudentCompletionPath && !isGoogleTeacherCompletionPath) {
              router.replace('/register/student/complete');
            }
            return;
          }

          router.replace(getRoleDashboardPath(profile.role));
        }
      } catch {
        // Server-side guards still handle the canonical auth redirect.
      }
    }

    void redirectIfAuthenticated();
    window.addEventListener('pageshow', redirectIfAuthenticated);
    return () => {
      cancelled = true;
      window.removeEventListener('pageshow', redirectIfAuthenticated);
    };
  }, [pathname, router]);

  return null;
}
