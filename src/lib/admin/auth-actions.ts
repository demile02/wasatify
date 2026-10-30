'use server';

import { redirect } from 'next/navigation';
import { ADMIN_AUTH_EMAIL, ADMIN_LOGIN_USERNAME } from '@/lib/admin/config';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';

export async function loginAdminAction(formData: FormData) {
  const username = String(formData.get('username') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!isSupabaseConfigured) redirect('/admin/login?error=config');
  if (!username || !password || username.length > 80 || password.length > 200) {
    redirect('/admin/login?error=invalid');
  }

  if (username.toLowerCase() !== ADMIN_LOGIN_USERNAME) {
    redirect('/admin/login?error=invalid');
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: ADMIN_AUTH_EMAIL,
    password,
  });

  if (error || !data.user) redirect('/admin/login?error=invalid');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .maybeSingle();

  if (profile?.role !== 'admin') {
    await supabase.auth.signOut();
    redirect('/admin/login?error=invalid');
  }

  redirect('/admin/invites');
}

export async function logoutAdminAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/admin/login');
}
