'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';

export type ReviewReflectionResult = {
  ok: boolean;
  error?: string;
};

const reviewReflectionSchema = z.object({
  reflectionId: z.string().min(1, 'Refleksi tidak valid.'),
  teacherNote: z.string().max(1000, 'Catatan maksimal 1000 karakter.').optional(),
  markReviewed: z.boolean().optional(),
});

export async function reviewReflectionAction(input: {
  reflectionId: string;
  teacherNote?: string;
  markReviewed?: boolean;
}): Promise<ReviewReflectionResult> {
  const parsed = reviewReflectionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Data review tidak valid.' };
  }

  if (!isSupabaseConfigured) return { ok: true };

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { ok: false, error: 'Sesi guru belum aktif. Silakan masuk kembali.' };

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle<{ role: string | null }>();

    if (profile?.role !== 'admin') {
      const { data: reflection } = await supabase
        .from('reflections')
        .select('student_id, module_id')
        .eq('id', parsed.data.reflectionId)
        .maybeSingle<{ student_id: string; module_id: string }>();

      if (!reflection) return { ok: false, error: 'Refleksi tidak ditemukan.' };

      const { data: student } = await supabase
        .from('profiles')
        .select('class_id')
        .eq('id', reflection.student_id)
        .maybeSingle<{ class_id: string | null }>();

      const [{ data: classRow }, { data: moduleRow }] = await Promise.all([
        student?.class_id
          ? supabase.from('classes').select('id').eq('id', student.class_id).eq('teacher_id', user.id).maybeSingle()
          : Promise.resolve({ data: null }),
        supabase.from('modules').select('id').eq('id', reflection.module_id).eq('created_by', user.id).maybeSingle(),
      ]);

      if (!classRow || !moduleRow) {
        return { ok: false, error: 'Anda tidak memiliki akses untuk meninjau refleksi ini.' };
      }
    }

    const payload: Record<string, string | null> = {
      teacher_note: parsed.data.teacherNote?.trim() || null,
    };

    if (parsed.data.markReviewed) {
      payload.reviewed_by = user.id;
      payload.reviewed_at = new Date().toISOString();
    }

    const { error } = await supabase.from('reflections').update(payload).eq('id', parsed.data.reflectionId);
    if (error) throw error;

    revalidatePath('/teacher/reflections');
    revalidatePath('/teacher/reports');
    revalidatePath('/teacher/classes');

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Review refleksi belum berhasil disimpan.',
    };
  }
}
