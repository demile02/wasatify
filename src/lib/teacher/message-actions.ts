'use server';

import { revalidatePath } from 'next/cache';
import { requireTeacher } from '@/lib/auth/server';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { teacherMessageSchema } from '@/lib/teacher/message-validation';

export type TeacherMessageActionResult = {
  ok: boolean;
  error?: string;
};

export async function sendTeacherMessageAction(input: unknown): Promise<TeacherMessageActionResult> {
  const parsed = teacherMessageSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Pesan tidak valid.' };
  }

  if (!isSupabaseConfigured) {
    return { ok: false, error: 'Pesan belum bisa dikirim karena database belum terhubung.' };
  }

  try {
    const profile = await requireTeacher();
    if (!profile) return { ok: false, error: 'Sesi guru tidak ditemukan. Silakan masuk kembali.' };

    const supabase = await createClient();
    let classQuery = supabase.from('classes').select('id').eq('id', parsed.data.classId);
    if (profile.role === 'teacher') classQuery = classQuery.eq('teacher_id', profile.id);

    const { data: classRow, error: classError } = await classQuery.maybeSingle();
    if (classError) throw classError;
    if (!classRow) return { ok: false, error: 'Kelas tujuan tidak tersedia untuk akun ini.' };

    const { error } = await supabase.from('messages').insert({
      sender_id: profile.id,
      recipient_id: null,
      target_class_id: parsed.data.classId,
      title: parsed.data.title,
      body: parsed.data.body,
    });

    if (error) throw error;

    revalidatePath('/teacher/messages');
    revalidatePath('/student/messages');
    revalidatePath('/student/dashboard');
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Pesan belum berhasil dikirim.',
    };
  }
}
