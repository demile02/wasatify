'use server';

import { revalidatePath } from 'next/cache';
import { requireStudent } from '@/lib/auth/server';
import { submitAssignmentSchema } from '@/lib/assignments/validation';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';

export type StudentAssignmentActionResult = { ok: boolean; error?: string };

export async function submitAssignmentAction(input: unknown): Promise<StudentAssignmentActionResult> {
  const parsed = submitAssignmentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Jawaban tidak valid.' };
  if (!isSupabaseConfigured) return { ok: false, error: 'Jawaban belum bisa dikirim karena database belum terhubung.' };

  const profile = await requireStudent();
  if (!profile) return { ok: false, error: 'Sesi siswa tidak ditemukan. Silakan masuk kembali.' };

  try {
    const supabase = await createClient();
    const { error } = await supabase.rpc('submit_class_assignment', {
      target_assignment_id: parsed.data.assignmentId,
      answer_text: parsed.data.answer,
      file_path_input: parsed.data.attachment?.path ?? null,
      file_name_input: parsed.data.attachment?.fileName ?? null,
      file_size_input: parsed.data.attachment?.fileSize ?? null,
      file_type_input: parsed.data.attachment?.fileType ?? null,
    });
    if (error) throw error;

    revalidatePath('/student/tasks');
    revalidatePath('/teacher/tasks');
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Jawaban belum berhasil dikirim.' };
  }
}
