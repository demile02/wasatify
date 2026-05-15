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
