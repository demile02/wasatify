'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireUser } from '@/lib/auth/server';
import { createClient } from '@/lib/supabase/server';

type NotificationActionResult = {
  ok: boolean;
  error?: string;
};

const notificationKeySchema = z.string().trim().min(3).max(180);
const markAllSchema = z.array(notificationKeySchema).max(50);
const uuidSchema = z.string().uuid();

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
    await syncMessageReadFromNotificationKey(supabase, user.id, parsed.data);
    revalidatePath('/student/announcements');
    revalidatePath('/student/messages');
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
    await Promise.all(uniqueKeys.map((notificationKey) => syncMessageReadFromNotificationKey(supabase, user.id, notificationKey)));
    revalidatePath('/student/announcements');
    revalidatePath('/student/messages');
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Gagal menandai semua notifikasi sebagai dibaca.',
    };
  }
}

export async function markMessageReadAction(messageId: string): Promise<NotificationActionResult> {
  const parsed = uuidSchema.safeParse(messageId);
  if (!parsed.success) return { ok: false, error: 'Pesan tidak valid.' };

  try {
    const user = await requireUser();
    if (!user) return { ok: false, error: 'Sesi akun tidak ditemukan.' };

    const now = new Date().toISOString();
    const supabase = await createClient();
    const [messageReadResult, notificationReadResult] = await Promise.all([
      supabase.from('message_reads').upsert(
        {
          message_id: parsed.data,
          user_id: user.id,
          read_at: now,
        },
        { onConflict: 'message_id,user_id' },
      ),
      supabase.from('notification_reads').upsert(
        {
          user_id: user.id,
          notification_key: `message:${parsed.data}`,
          read_at: now,
        },
        { onConflict: 'user_id,notification_key' },
      ),
    ]);

    if (messageReadResult.error || notificationReadResult.error) {
      throw messageReadResult.error ?? notificationReadResult.error;
    }

    revalidatePath('/student/messages');
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Gagal menandai pesan sebagai dibaca.',
    };
  }
}

async function syncMessageReadFromNotificationKey(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  notificationKey: string,
) {
  if (!notificationKey.startsWith('message:')) return;

  const messageId = notificationKey.slice('message:'.length);
  if (!uuidSchema.safeParse(messageId).success) return;

  await supabase.from('message_reads').upsert(
    {
      message_id: messageId,
      user_id: userId,
      read_at: new Date().toISOString(),
    },
    { onConflict: 'message_id,user_id' },
  );
}
