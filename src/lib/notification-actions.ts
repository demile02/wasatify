'use server';

import { z } from 'zod';
import { requireUser } from '@/lib/auth/server';
import { createClient } from '@/lib/supabase/server';

type NotificationActionResult = {
  ok: boolean;
  error?: string;
};

const notificationKeySchema = z.string().trim().min(3).max(180);
const markAllSchema = z.array(notificationKeySchema).max(50);

export async function markNotificationReadAction(notificationKey: string): Promise<NotificationActionResult> {
  const parsed = notificationKeySchema.safeParse(notificationKey);
  if (!parsed.success) return { ok: false, error: 'Notifikasi tidak valid.' };

  try {
    const user = await requireUser();
    if (!user) return { ok: false, error: 'Sesi akun tidak ditemukan.' };

    const supabase = await createClient();
    const { error } = await supabase.from('notification_reads').upsert(
      {
        user_id: user.id,
        notification_key: parsed.data,
        read_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,notification_key' },
    );

    if (error) throw error;
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Gagal menandai notifikasi sebagai dibaca.',
    };
  }
}

export async function markAllNotificationsReadAction(notificationKeys: string[]): Promise<NotificationActionResult> {
  const parsed = markAllSchema.safeParse(notificationKeys);
  if (!parsed.success) return { ok: false, error: 'Daftar notifikasi tidak valid.' };

  const uniqueKeys = Array.from(new Set(parsed.data));
  if (!uniqueKeys.length) return { ok: true };

  try {
    const user = await requireUser();
    if (!user) return { ok: false, error: 'Sesi akun tidak ditemukan.' };

    const now = new Date().toISOString();
    const supabase = await createClient();
    const { error } = await supabase.from('notification_reads').upsert(
      uniqueKeys.map((notificationKey) => ({
        user_id: user.id,
        notification_key: notificationKey,
        read_at: now,
      })),
      { onConflict: 'user_id,notification_key' },
    );

    if (error) throw error;
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Gagal menandai semua notifikasi sebagai dibaca.',
    };
  }
}
