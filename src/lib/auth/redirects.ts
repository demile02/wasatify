import { redirect } from 'next/navigation';
import { getRoleDashboardPath } from '@/lib/auth/roles';
import { getCurrentProfile } from '@/lib/auth/server';

export async function redirectAuthenticatedUser() {
  const profile = await getCurrentProfile();

  if (profile) {
    redirect(getRoleDashboardPath(profile.role));
  }
}
