import { redirect } from 'next/navigation';
import { cache } from 'react';
import type { User } from '@supabase/supabase-js';
import { getRoleDashboardPath } from '@/lib/auth/roles';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import type { AppRole, Profile } from '@/lib/types';

const profileSelect =
  'id, role, full_name, email, avatar_url, school_name, class_id, class_name, subject, bio, xp, streak_count, quick_access, last_active_at, created_at, updated_at';

type ProfileWithLinkedClass = Profile & {
  student_class: { name: string } | null;
};

export const getCurrentUser = cache(async (): Promise<User | null> => {
  if (!isSupabaseConfigured) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
});

export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  if (!isSupabaseConfigured) return null;

  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select(`${profileSelect}, student_class:classes!profiles_class_id_fkey(name)`)
    .eq('id', user.id)
    .maybeSingle<ProfileWithLinkedClass>();

  if (error) throw new Error('Profil gagal dimuat. Silakan coba lagi.', { cause: error });

  if (!data) return null;

  const { student_class: studentClass, ...profile } = data;
  return {
    ...profile,
    class_name: data.class_id ? studentClass?.name ?? null : data.class_name,
  };
});

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
  const profile = await requireRole('student');

  if (profile && !profile.class_id) {
    redirect('/register/student/complete');
  }

  return profile;
}

export async function requireTeacher() {
  return requireRole(['teacher', 'admin']);
}
