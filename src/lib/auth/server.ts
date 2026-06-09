import { redirect } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { getRoleDashboardPath } from '@/lib/auth/roles';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import type { AppRole, Profile } from '@/lib/types';

const profileSelect =
  'id, role, full_name, email, avatar_url, school_name, class_id, class_name, subject, bio, xp, streak_count, quick_access, last_active_at, created_at, updated_at';

export async function getCurrentUser(): Promise<User | null> {
  if (!isSupabaseConfigured) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function getCurrentProfile(): Promise<Profile | null> {
  if (!isSupabaseConfigured) return null;

  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from('profiles')
    .select(profileSelect)
    .eq('id', user.id)
    .maybeSingle<Profile>();

  return data ?? null;
}

export async function requireUser(): Promise<User | null> {
  if (!isSupabaseConfigured) return null;

  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  return user;
}

export async function requireRole(allowedRole: AppRole | AppRole[]): Promise<Profile | null> {
  if (!isSupabaseConfigured) return null;

  await requireUser();

  const profile = await getCurrentProfile();
  if (!profile) {
    redirect('/login');
  }

  const allowedRoles = Array.isArray(allowedRole) ? allowedRole : [allowedRole];

  if (!allowedRoles.includes(profile.role)) {
    redirect(getRoleDashboardPath(profile.role));
  }

  return profile;
}

export async function requireStudent() {
  return requireRole('student');
}

export async function requireTeacher() {
  return requireRole(['teacher', 'admin']);
}
