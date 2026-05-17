'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';

type ActionResult = {
  ok: boolean;
  error?: string;
};

const announcementSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(5, 'Judul minimal 5 karakter.'),
  content: z.string().min(20, 'Isi pengumuman minimal 20 karakter.'),
  classId: z.string().nullable().optional(),
  status: z.enum(['draft', 'published']),
});

export async function saveAnnouncementAction(input: z.infer<typeof announcementSchema>): Promise<ActionResult> {
  const parsed = announcementSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Data pengumuman tidak valid.' };
  }

  if (!isSupabaseConfigured) return { ok: true };

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { ok: false, error: 'Sesi guru belum aktif. Silakan masuk kembali.' };
    const isAdmin = await currentUserIsAdmin(supabase, user.id);

    if (parsed.data.classId && !isAdmin) {
      const { data: classRow, error: classError } = await supabase
        .from('classes')
        .select('id')
        .eq('id', parsed.data.classId)
        .eq('teacher_id', user.id)
        .maybeSingle();

      if (classError) throw classError;
      if (!classRow) {
        return { ok: false, error: 'Kelas tujuan tidak tersedia untuk akun guru ini.' };
      }
    }

    if (parsed.data.id && !isAdmin) {
      const { data: announcement, error: announcementError } = await supabase
        .from('announcements')
        .select('id')
        .eq('id', parsed.data.id)
        .eq('teacher_id', user.id)
        .maybeSingle();

      if (announcementError) throw announcementError;
      if (!announcement) {
        return { ok: false, error: 'Anda tidak memiliki akses untuk mengubah pengumuman ini.' };
      }
    }

    const payload = {
      teacher_id: user.id,
      title: parsed.data.title.trim(),
      content: parsed.data.content.trim(),
      class_id: parsed.data.classId || null,
      status: parsed.data.status,
      published_at: parsed.data.status === 'published' ? new Date().toISOString() : null,
    };

    const result = parsed.data.id
      ? await supabase.from('announcements').update(payload).eq('id', parsed.data.id)
      : await supabase.from('announcements').insert(payload);

    if (result.error) throw result.error;
    revalidateTeacherAnnouncementPaths();

    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Pengumuman belum berhasil disimpan.' };
  }
}

export async function toggleAnnouncementStatusAction(id: string, nextStatus: 'draft' | 'published'): Promise<ActionResult> {
  if (!isSupabaseConfigured) return { ok: true };

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { ok: false, error: 'Sesi guru belum aktif. Silakan masuk kembali.' };

    const query = supabase
      .from('announcements')
      .update({
        status: nextStatus,
        published_at: nextStatus === 'published' ? new Date().toISOString() : null,
      })
      .eq('id', id);

    const { error } = (await currentUserIsAdmin(supabase, user.id)) ? await query : await query.eq('teacher_id', user.id);

    if (error) throw error;
    revalidateTeacherAnnouncementPaths();

    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Status pengumuman belum berhasil diubah.' };
  }
}

export async function deleteAnnouncementAction(id: string): Promise<ActionResult> {
  if (!isSupabaseConfigured) return { ok: true };

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { ok: false, error: 'Sesi guru belum aktif. Silakan masuk kembali.' };

    const query = supabase.from('announcements').delete().eq('id', id);
    const { error } = (await currentUserIsAdmin(supabase, user.id)) ? await query : await query.eq('teacher_id', user.id);

    if (error) throw error;
    revalidateTeacherAnnouncementPaths();

    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Pengumuman belum berhasil dihapus.' };
  }
}

function revalidateTeacherAnnouncementPaths() {
  revalidatePath('/teacher/announcements');
  revalidatePath('/teacher/dashboard');
  revalidatePath('/student/dashboard');
}

async function currentUserIsAdmin(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase.from('profiles').select('role').eq('id', userId).maybeSingle<{ role: string | null }>();
  return data?.role === 'admin';
}
