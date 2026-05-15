'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';

export type ToggleModulePublishResult = {
  ok: boolean;
  error?: string;
  status?: 'published' | 'draft';
};

const toggleModulePublishSchema = z.object({
  moduleId: z.string().min(1),
  currentStatus: z.enum(['published', 'draft', 'archived']),
});

export async function toggleTeacherModulePublishAction(input: {
  moduleId: string;
  currentStatus: 'published' | 'draft' | 'archived';
}): Promise<ToggleModulePublishResult> {
  const parsed = toggleModulePublishSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: 'Data modul tidak valid.' };
  }

  if (!isSupabaseConfigured) {
    return {
      ok: true,
      status: parsed.data.currentStatus === 'published' ? 'draft' : 'published',
    };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { ok: false, error: 'Sesi guru belum aktif. Silakan masuk kembali.' };
    }

    const nextStatus = parsed.data.currentStatus === 'published' ? 'draft' : 'published';
    const { error } = await supabase
      .from('modules')
      .update({
        status: nextStatus,
        published_at: nextStatus === 'published' ? new Date().toISOString() : null,
      })
      .eq('id', parsed.data.moduleId);

    if (error) throw error;

    revalidatePath('/teacher/modules');
    revalidatePath('/teacher/dashboard');
    revalidatePath(`/teacher/modules/${parsed.data.moduleId}/edit`);

    return { ok: true, status: nextStatus };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Status modul belum berhasil diperbarui.',
    };
  }
}
