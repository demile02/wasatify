'use server';

import { randomBytes } from 'node:crypto';
import { getCurrentProfile } from '@/lib/auth/server';
import { createClient } from '@/lib/supabase/server';

export type TeacherInviteCodeRecord = {
  id: string;
  code: string;
  teacher_name: string | null;
  created_at: string;
  expires_at: string | null;
  used_at: string | null;
  is_active: boolean;
};

type GenerateTeacherInviteCodeResult =
  | { ok: true; invite: TeacherInviteCodeRecord }
  | { ok: false; error: string };

const allowedExpiryDays = [1, 3, 7];

export async function generateTeacherInviteCodeAction(
  teacherName: string,
  expiresInDays: number,
): Promise<GenerateTeacherInviteCodeResult> {
  const profile = await getCurrentProfile();
  if (profile?.role !== 'admin') {
    return { ok: false, error: 'Hanya admin yang dapat membuat kode guru.' };
  }

  if (!allowedExpiryDays.includes(expiresInDays)) {
    return { ok: false, error: 'Pilih masa berlaku kode yang tersedia.' };
  }

  const normalizedName = typeof teacherName === 'string' ? teacherName.trim().replace(/\s+/g, ' ') : '';
  if (!normalizedName || normalizedName.length > 120) {
    return { ok: false, error: 'Isi nama guru (maksimal 120 karakter).' };
  }

  let supabase: Awaited<ReturnType<typeof createClient>>;
  try {
    supabase = await createClient();
  } catch {
    return { ok: false, error: 'Koneksi database admin belum dikonfigurasi.' };
  }
  const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString();

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const code = `GURU-${randomBytes(8).toString('hex').toUpperCase()}`;
    const { data, error } = await supabase
      .from('teacher_invite_codes')
      .insert({
        code,
        teacher_name: normalizedName,
        created_by: profile.id,
        expires_at: expiresAt,
        is_active: true,
      })
      .select('id, code, teacher_name, created_at, expires_at, used_at, is_active')
      .single();

    if (error?.code === '23505') continue;
    if (error || !data) {
      return { ok: false, error: 'Kode belum berhasil dibuat. Coba lagi.' };
    }

    return { ok: true, invite: data };
  }

  return { ok: false, error: 'Kode unik belum berhasil dibuat. Coba lagi.' };
}

export async function cancelTeacherInviteCodeAction(
  inviteId: string,
): Promise<GenerateTeacherInviteCodeResult> {
  const profile = await getCurrentProfile();
  if (profile?.role !== 'admin') {
    return { ok: false, error: 'Hanya admin yang dapat membatalkan kode guru.' };
  }

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(inviteId)) {
    return { ok: false, error: 'Kode guru tidak valid.' };
  }

  let supabase: Awaited<ReturnType<typeof createClient>>;
  try {
    supabase = await createClient();
  } catch {
    return { ok: false, error: 'Koneksi database admin belum dikonfigurasi.' };
  }

  const { data, error } = await supabase
    .from('teacher_invite_codes')
    .update({ is_active: false })
    .eq('id', inviteId)
    .eq('is_active', true)
    .is('used_at', null)
    .select('id, code, teacher_name, created_at, expires_at, used_at, is_active')
    .maybeSingle();

  if (error) return { ok: false, error: 'Kode belum berhasil dibatalkan. Coba lagi.' };
  if (!data) return { ok: false, error: 'Kode ini sudah dipakai atau tidak lagi aktif.' };
  return { ok: true, invite: data };
}
