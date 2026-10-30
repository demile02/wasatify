'use server';

import { revalidatePath } from 'next/cache';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import type {
  ModuleEditorLesson,
  ModuleEditorQuiz,
} from '@/lib/teacher/module-editor';
import { buildModuleChildren } from '@/lib/teacher/module-save-payload';
import { saveTeacherModuleSchema } from '@/lib/teacher/module-save-validation';
import type { AppRole } from '@/lib/types';
import type { ModuleImageCropConfig } from '@/lib/media/image-crops';

export type UploadedAssetInput = {
  bucket: string;
  path: string;
  publicUrl: string;
  mimeType?: string;
  sizeBytes?: number;
};

export type SaveTeacherModuleInput = {
  moduleId?: string;
  title: string;
  slug: string;
  description: string;
  classId?: string;
  estimatedMinutes: number;
  orderIndex: number;
  difficulty?: 'pemula' | 'menengah' | 'lanjut' | '';
  tags: string[];
  coverImagePath?: string;
  coverAsset?: UploadedAssetInput;
  heroImagePath?: string;
  imageCropConfig?: ModuleImageCropConfig | null;
  status: 'draft' | 'published' | 'archived';
  isPublic: boolean;
  lessons: ModuleEditorLesson[];
  quiz: ModuleEditorQuiz;
  intent: 'draft' | 'publish';
  notification?: {
    enabled: boolean;
    message?: string;
    type?: 'publish' | 'update' | 'quiz_update';
  };
};

export type SaveTeacherModuleResult = {
  ok: boolean;
  moduleId?: string;
  error?: string;
};

type ProfileRoleRow = {
  role: AppRole;
};

export async function saveTeacherModuleAction(
  input: SaveTeacherModuleInput,
): Promise<SaveTeacherModuleResult> {
  const parsed = saveTeacherModuleSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Data modul tidak valid.' };
  }

  input = { ...parsed.data, slug: parsed.data.slug ?? '' };
  const validationError = validateModuleInput(input);
  if (validationError) return { ok: false, error: validationError };

  if (!isSupabaseConfigured) {
    return { ok: true, moduleId: input.moduleId ?? 'demo-module-saved' };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { ok: false, error: 'Sesi guru belum aktif. Silakan masuk kembali.' };
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle<ProfileRoleRow>();

    if (!profile || (profile.role !== 'teacher' && profile.role !== 'admin')) {
      return { ok: false, error: 'Akses hanya untuk guru atau admin.' };
    }

    const isPublishing = input.intent === 'publish';
    const now = new Date().toISOString();
    const slug = await resolveUniqueModuleSlug(input.slug || input.title, input.moduleId);
    const orderIndex = await resolveModuleOrderIndex(user.id, input.orderIndex, input.moduleId);
    const modulePayload: Record<string, unknown> = {
      class_id: input.classId || null,
      title: input.title.trim(),
      slug,
      description: input.description.trim(),
      cover_image_path: input.coverImagePath?.trim() || null,
      hero_image_path: input.heroImagePath?.trim() || null,
      image_crop_config: input.imageCropConfig ?? null,
      difficulty: input.difficulty || null,
      tags: normalizeTags(input.tags),
      status: isPublishing ? 'published' : input.status === 'archived' ? 'archived' : 'draft',
      is_public: input.isPublic,
      estimated_minutes: Math.max(Math.round(input.estimatedMinutes), 1),
      order_index: orderIndex,
      published_at: isPublishing ? now : null,
    };

    const { data: moduleId, error: saveError } = await supabase.rpc('save_teacher_module', {
      module_id_input: input.moduleId || null,
      module_input: modulePayload,
      ...buildModuleChildren(input, user.id),
    });
    if (saveError) throw saveError;
    if (typeof moduleId !== 'string') throw new Error('Modul belum berhasil disimpan.');

    revalidatePath('/teacher/dashboard');
    revalidatePath('/teacher/modules');
    revalidatePath(`/teacher/modules/${moduleId}/edit`);
    revalidatePath('/student', 'layout');
    revalidatePath('/teacher/quizzes');
    revalidatePath('/teacher/announcements');

    return { ok: true, moduleId };
  } catch (error) {
    return {
      ok: false,
      error: formatSupabaseError(error, 'Gagal menyimpan modul.'),
    };
  }
}

function validateModuleInput(input: SaveTeacherModuleInput) {
  const filledLessons = input.lessons.filter((lesson) => lesson.title.trim() || lesson.content.trim());

  if (input.intent === 'publish' && !filledLessons.length) {
    return 'Tambahkan minimal satu lesson sebelum publish.';
  }

  for (const lesson of filledLessons) {
    if (!lesson.title.trim()) return 'Setiap lesson wajib memiliki judul.';
    if (!lesson.content.trim()) return `Konten lesson "${lesson.title}" wajib diisi.`;
  }

  const filledQuestions = input.quiz.questions.filter((question) => question.questionText.trim());
  const maxAttempts = Math.max(Math.round(input.quiz.maxAttempts), 1);

  if (maxAttempts === 1 && input.quiz.allowRetake) {
    return 'Izinkan Mengulang hanya tersedia jika Jumlah Kesempatan lebih dari 1.';
  }

  if (input.intent === 'publish' && !filledQuestions.length) {
    return 'Tambahkan minimal satu pertanyaan kuis sebelum publish.';
  }
  if (filledQuestions.length > 100) {
    return 'Kuis maksimal 100 pertanyaan agar nilai maksimal tetap 100 poin.';
  }

  for (const question of filledQuestions) {
    const questionType: unknown = question.questionType;
    if (questionType !== 'multiple_choice') {
      return 'Semua pertanyaan kuis harus menggunakan Multiple Choice.';
    }
    if (question.options.some((option) => !option.trim())) {
      return 'Setiap pertanyaan pilihan ganda wajib memiliki lima opsi jawaban A–E.';
    }
    if (!question.explanation.trim()) {
      return 'Setiap pertanyaan kuis wajib memiliki penjelasan.';
    }
    if (!Number.isFinite(question.points) || question.points < 1) {
      return 'Poin pertanyaan harus lebih dari 0.';
    }
  }

  return null;
}

function normalizeTags(tags: string[]) {
  return tags
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function normalizeSlug(value: string) {
  return slugify(value);
}

async function resolveUniqueModuleSlug(value: string, moduleId?: string) {
  const supabase = await createClient();
  const baseSlug = normalizeSlug(value);
  let candidate = baseSlug;
  let suffix = 2;

  while (true) {
    let query = supabase.from('modules').select('id').eq('slug', candidate).limit(1);
    if (moduleId) query = query.neq('id', moduleId);

    const { data, error } = await query;
    if (error) throw error;
    if (!data?.length) return candidate;

    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
}

async function resolveModuleOrderIndex(teacherId: string, value: number, moduleId?: string) {
  if (moduleId && Number.isFinite(value) && value >= 1) {
    return Math.max(Math.round(value), 1);
  }

  const supabase = await createClient();
  let query = supabase
    .from('modules')
    .select('order_index')
    .or(`created_by.eq.${teacherId},teacher_id.eq.${teacherId}`)
    .order('order_index', { ascending: false })
    .limit(1);

  if (moduleId) query = query.neq('id', moduleId);

  const { data, error } = await query;
  if (error) throw error;

  const maxOrderIndex = Number(data?.[0]?.order_index ?? 0);
  return maxOrderIndex + 1;
}

function formatSupabaseError(error: unknown, fallback: string) {
  if (!error || typeof error !== 'object') {
    return error instanceof Error ? error.message : fallback;
  }

  const maybeError = error as {
    message?: string;
    code?: string;
    details?: string;
    hint?: string;
  };
  const parts = [
    maybeError.message,
    maybeError.code ? `Kode: ${maybeError.code}` : null,
    maybeError.details ? `Detail: ${maybeError.details}` : null,
    maybeError.hint ? `Hint: ${maybeError.hint}` : null,
  ].filter(Boolean);

  return parts.length ? parts.join(' | ') : fallback;
}

function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || 'modul';
}
