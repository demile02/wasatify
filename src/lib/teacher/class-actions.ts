'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';

export type SaveTeacherClassResult = {
  ok: boolean;
  error?: string;
  classId?: string;
};

const saveTeacherClassSchema = z.object({
  classId: z.string().optional(),
  name: z.string().trim().min(2, 'Nama kelas minimal 2 karakter.'),
  gradeLevel: z.string().trim().max(50, 'Tingkat maksimal 50 karakter.').optional(),
  academicYear: z.string().trim().max(20, 'Tahun ajaran maksimal 20 karakter.').optional(),
  description: z.string().trim().max(300, 'Deskripsi maksimal 300 karakter.').optional(),
});

export async function saveTeacherClassAction(input: {
  classId?: string;
  name: string;
  gradeLevel?: string;
  academicYear?: string;
  description?: string;
}): Promise<SaveTeacherClassResult> {
  const parsed = saveTeacherClassSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Data kelas tidak valid.' };
  }

  if (!isSupabaseConfigured) {
    return { ok: true, classId: parsed.data.classId ?? 'demo-class' };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { ok: false, error: 'Sesi guru belum aktif. Silakan masuk kembali.' };

    const payload = {
      teacher_id: user.id,
      name: parsed.data.name,
      grade_level: parsed.data.gradeLevel || null,
      academic_year: parsed.data.academicYear || null,
      description: parsed.data.description || null,
    };

    if (parsed.data.classId) {
      const { error } = await supabase.from('classes').update(payload).eq('id', parsed.data.classId);
      if (error) throw error;
    } else {
      const { data, error } = await supabase.from('classes').insert(payload).select('id').single<{ id: string }>();
      if (error) throw error;
      parsed.data.classId = data.id;
    }

    revalidatePath('/teacher/classes');
    revalidatePath('/teacher/dashboard');
    if (parsed.data.classId) revalidatePath(`/teacher/classes/${parsed.data.classId}`);

    return { ok: true, classId: parsed.data.classId };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Kelas belum berhasil disimpan.',
    };
  }
}
