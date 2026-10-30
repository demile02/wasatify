'use server';

import { revalidatePath } from 'next/cache';
import { requireTeacher } from '@/lib/auth/server';
import { createAssignmentSchema, reviewAssignmentSchema } from '@/lib/assignments/validation';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';

export type AssignmentActionResult = { ok: boolean; error?: string };

export async function createAssignmentAction(input: unknown): Promise<AssignmentActionResult> {
  const parsed = createAssignmentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Tugas tidak valid.' };
  if (!isSupabaseConfigured) return { ok: false, error: 'Tugas belum bisa disimpan karena database belum terhubung.' };

  const profile = await requireTeacher();
  if (!profile) return { ok: false, error: 'Sesi guru tidak ditemukan. Silakan masuk kembali.' };

  try {
    const supabase = await createClient();
    const { error } = await supabase.rpc('create_class_assignment', {
      assignment_class_id: parsed.data.classId,
      assignment_title: parsed.data.title,
      assignment_instructions: parsed.data.instructions,
      assignment_due_at: parsed.data.dueAt,
    });
    if (error) throw error;

    revalidatePath('/teacher/tasks');
    revalidatePath('/student/tasks');
    revalidatePath('/demo/teacher/tasks');
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Tugas belum berhasil dibuat.' };
  }
}

export async function reviewAssignmentAction(input: unknown): Promise<AssignmentActionResult> {
  const parsed = reviewAssignmentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Penilaian tidak valid.' };
  if (!isSupabaseConfigured) return { ok: false, error: 'Penilaian belum bisa disimpan karena database belum terhubung.' };

  const profile = await requireTeacher();
  if (!profile) return { ok: false, error: 'Sesi guru tidak ditemukan. Silakan masuk kembali.' };

  try {
    const supabase = await createClient();
    const { error } = await supabase.rpc('review_class_assignment', {
      target_submission_id: parsed.data.submissionId,
      score_input: parsed.data.score,
      feedback_input: parsed.data.feedback || null,
    });
    if (error) throw error;

    revalidatePath('/teacher/tasks');
    revalidatePath('/student/tasks');
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Penilaian belum berhasil disimpan.' };
  }
}
