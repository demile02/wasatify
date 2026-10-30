'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { normalizeQuizPoints } from '@/lib/quiz-scoring';
import { QUIZ_OPTION_IDS } from '@/lib/teacher/quiz-constants';
import type { AppRole } from '@/lib/types';

export type ToggleModulePublishResult = {
  ok: boolean;
  error?: string;
  status?: 'published' | 'draft';
};

export type TeacherModuleActionResult = {
  ok: boolean;
  error?: string;
  moduleId?: string;
};

const toggleModulePublishSchema = z.object({
  moduleId: z.string().min(1),
  currentStatus: z.enum(['published', 'draft', 'archived']),
});

const moduleIdSchema = z.string().uuid('ID modul tidak valid.');

type ProfileRoleRow = {
  role: AppRole;
};

type ModuleActionRow = {
  id: string;
  teacher_id: string | null;
  created_by: string | null;
  class_id: string | null;
  title: string;
  slug: string;
  description: string;
  cover_image_path: string | null;
  hero_image_path: string | null;
  image_crop_config: unknown;
  difficulty: 'pemula' | 'menengah' | 'lanjut' | null;
  tags: string[] | null;
  status: 'published' | 'draft' | 'archived';
  is_public: boolean | null;
  estimated_minutes: number | null;
  order_index: number | null;
};

type LessonActionRow = {
  title: string;
  slug: string;
  type: string;
  content: string | null;
  key_points: unknown;
  reflection_prompt: string | null;
  video_url: string | null;
  infographic_url: string | null;
  order_index: number | null;
  estimated_minutes: number | null;
};

type QuizActionRow = {
  id: string;
  title: string;
  description: string | null;
  passing_score: number | null;
  max_attempts: number | null;
  time_limit_seconds: number | null;
  allow_retake: boolean | null;
  show_explanation: boolean | null;
  shuffle_questions: boolean | null;
};

type QuestionActionRow = {
  question_type: string;
  question_text: string;
  options: unknown;
  correct_answer: unknown;
  explanation: string | null;
  show_explanation: boolean | null;
  points: number | null;
  order_index: number | null;
};

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

    const profile = await getCurrentActionProfile(supabase, user.id);
    const moduleItem = await getOwnedModule(supabase, parsed.data.moduleId, user.id, profile.role);
    if (!moduleItem) {
      return { ok: false, error: 'Modul tidak ditemukan atau bukan milik akun ini.' };
    }

    const nextStatus = parsed.data.currentStatus === 'published' ? 'draft' : 'published';
    const { error } = await supabase
      .from('modules')
      .update({
        status: nextStatus,
        published_at: nextStatus === 'published' ? new Date().toISOString() : null,
      })
      .eq('id', moduleItem.id);

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

export async function duplicateTeacherModuleAction(moduleId: string): Promise<TeacherModuleActionResult> {
  const parsed = moduleIdSchema.safeParse(moduleId);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'ID modul tidak valid.' };

  if (!isSupabaseConfigured) {
    return { ok: true, moduleId: 'demo-module-copy' };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { ok: false, error: 'Sesi guru belum aktif. Silakan masuk kembali.' };

    const profile = await getCurrentActionProfile(supabase, user.id);
    const original = await getOwnedModule(supabase, parsed.data, user.id, profile.role);
    if (!original) return { ok: false, error: 'Modul tidak ditemukan atau bukan milik akun ini.' };

    const [lessonsResult, quizzesResult] = await Promise.all([
      supabase
        .from('lessons')
        .select('title, slug, type, content, key_points, reflection_prompt, video_url, infographic_url, order_index, estimated_minutes')
        .eq('module_id', original.id)
        .order('order_index', { ascending: true }),
      supabase
        .from('quizzes')
        .select('id, title, description, passing_score, max_attempts, time_limit_seconds, allow_retake, show_explanation, shuffle_questions')
        .eq('module_id', original.id)
        .order('created_at', { ascending: true })
        .limit(1),
    ]);

    if (lessonsResult.error) throw lessonsResult.error;
    if (quizzesResult.error) throw quizzesResult.error;

    const actorId = user.id;
    const newSlug = await resolveUniqueModuleSlug(supabase, `${original.slug}-salinan`);
    const orderIndex = await getNextModuleOrderIndex(supabase, actorId);
    const quiz = ((quizzesResult.data ?? []) as QuizActionRow[])[0];
    let questions: QuestionActionRow[] = [];
    if (quiz) {
      const result = await supabase.from('quiz_questions')
        .select('question_type, question_text, options, correct_answer, explanation, show_explanation, points, order_index')
        .eq('quiz_id', quiz.id).order('order_index', { ascending: true });
      if (result.error) throw result.error;
      questions = (result.data ?? []) as QuestionActionRow[];
    }
    const points = normalizeQuizPoints(questions.map((question) => question.points ?? 10));
    const { data: newModuleId, error } = await supabase.rpc('save_teacher_module', {
      module_id_input: null,
      module_input: {
        class_id: original.class_id, title: `${original.title} (Salinan)`, slug: newSlug,
        description: original.description, cover_image_path: original.cover_image_path,
        hero_image_path: original.hero_image_path, image_crop_config: original.image_crop_config,
        difficulty: original.difficulty, tags: original.tags ?? [], status: 'draft',
        is_public: original.is_public ?? true, estimated_minutes: original.estimated_minutes ?? 15,
        order_index: orderIndex, published_at: null,
      },
      lessons_input: ((lessonsResult.data ?? []) as LessonActionRow[]).map((lesson, index) => ({
        ...lesson, id: crypto.randomUUID(), slug: lesson.slug || `${slugify(lesson.title)}-${index + 1}`,
        order_index: lesson.order_index ?? index + 1, estimated_minutes: lesson.estimated_minutes ?? 5,
      })),
      quiz_input: quiz ? {
        ...quiz, id: null, passing_score: quiz.passing_score ?? 70, max_attempts: quiz.max_attempts ?? 3,
        allow_retake: quiz.allow_retake ?? true, show_explanation: quiz.show_explanation ?? true,
        shuffle_questions: quiz.shuffle_questions ?? false, is_published: false, status: 'draft',
      } : null,
      questions_input: questions.map((question, index) => ({
        ...question, id: crypto.randomUUID(), question_type: 'multiple_choice',
        options: addMissingQuestionOptions(question.options),
        correct_answer: normalizeClonedCorrectAnswer(question.correct_answer),
        show_explanation: question.show_explanation ?? true, points: points[index], order_index: index + 1,
      })),
    });
    if (error) throw error;
    if (typeof newModuleId !== 'string') throw new Error('Modul salinan gagal dibuat.');

    revalidateTeacherModulePaths(newModuleId);
    return { ok: true, moduleId: newModuleId };
  } catch (error) {
    return { ok: false, error: formatActionError(error, 'Modul gagal diduplikasi.') };
  }
}

function addMissingQuestionOptions(value: unknown) {
  const options = Array.isArray(value) ? value.slice(0, QUIZ_OPTION_IDS.length) : [];
  return QUIZ_OPTION_IDS.map((id, index) => {
    const option = options[index];
    if (option && typeof option === 'object' && !Array.isArray(option)) {
      return { ...(option as Record<string, unknown>), id };
    }
    return { id, text: '' };
  });
}

function normalizeClonedCorrectAnswer(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { type: 'multiple_choice', value: 'a' };
  }
  const answer = value as Record<string, unknown>;
  return { ...answer, type: 'multiple_choice' };
}

export async function archiveTeacherModuleAction(moduleId: string): Promise<TeacherModuleActionResult> {
  const parsed = moduleIdSchema.safeParse(moduleId);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'ID modul tidak valid.' };

  return updateOwnedModuleStatus(parsed.data, 'archived');
}

export async function deleteTeacherModuleAction(moduleId: string): Promise<TeacherModuleActionResult> {
  const parsed = moduleIdSchema.safeParse(moduleId);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'ID modul tidak valid.' };

  if (!isSupabaseConfigured) return { ok: true };

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { ok: false, error: 'Sesi guru belum aktif. Silakan masuk kembali.' };

    const profile = await getCurrentActionProfile(supabase, user.id);
    const moduleItem = await getOwnedModule(supabase, parsed.data, user.id, profile.role);
    if (!moduleItem) return { ok: false, error: 'Modul tidak ditemukan atau bukan milik akun ini.' };

    const { error } = await supabase.from('modules').delete().eq('id', moduleItem.id);
    if (error) throw error;

    revalidateTeacherModulePaths(moduleItem.id);
    return { ok: true, moduleId: moduleItem.id };
  } catch (error) {
    return {
      ok: false,
      error: formatActionError(error, 'Modul gagal dihapus karena masih memiliki data terkait.'),
    };
  }
}

export async function reorderTeacherModuleAction(
  moduleId: string,
  direction: 'up' | 'down',
): Promise<TeacherModuleActionResult> {
  const parsed = moduleIdSchema.safeParse(moduleId);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'ID modul tidak valid.' };
  if (direction !== 'up' && direction !== 'down') return { ok: false, error: 'Arah urutan modul tidak valid.' };

  if (!isSupabaseConfigured) return { ok: true };

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { ok: false, error: 'Sesi guru belum aktif. Silakan masuk kembali.' };

    const profile = await getCurrentActionProfile(supabase, user.id);
    const current = await getOwnedModule(supabase, parsed.data, user.id, profile.role);
    if (!current) return { ok: false, error: 'Modul tidak ditemukan atau bukan milik akun ini.' };

    let neighborQuery = supabase
      .from('modules')
      .select('id, order_index')
      .neq('id', current.id)
      .order('order_index', { ascending: direction === 'down' })
      .limit(1);

    if (profile.role === 'teacher') {
      neighborQuery = neighborQuery.eq('created_by', user.id);
    }

    neighborQuery =
      direction === 'up'
        ? neighborQuery.lt('order_index', current.order_index ?? 1)
        : neighborQuery.gt('order_index', current.order_index ?? 1);

    const { data: neighbors, error: neighborError } = await neighborQuery;
    if (neighborError) throw neighborError;

    const neighbor = (neighbors ?? [])[0] as { id: string; order_index: number | null } | undefined;
    if (!neighbor) return { ok: true, moduleId: current.id };

    const currentOrder = current.order_index ?? 1;
    const neighborOrder = neighbor.order_index ?? currentOrder;

    const { error: bumpError } = await supabase.from('modules').update({ order_index: -1 }).eq('id', current.id);
    if (bumpError) throw bumpError;

    const { error: neighborUpdateError } = await supabase
      .from('modules')
      .update({ order_index: currentOrder })
      .eq('id', neighbor.id);
    if (neighborUpdateError) throw neighborUpdateError;

    const { error: currentUpdateError } = await supabase
      .from('modules')
      .update({ order_index: neighborOrder })
      .eq('id', current.id);
    if (currentUpdateError) throw currentUpdateError;

    revalidateTeacherModulePaths(current.id);
    return { ok: true, moduleId: current.id };
  } catch (error) {
    return { ok: false, error: formatActionError(error, 'Urutan modul belum berhasil diperbarui.') };
  }
}

async function updateOwnedModuleStatus(
  moduleId: string,
  status: 'draft' | 'published' | 'archived',
): Promise<TeacherModuleActionResult> {
  if (!isSupabaseConfigured) return { ok: true };

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { ok: false, error: 'Sesi guru belum aktif. Silakan masuk kembali.' };

    const profile = await getCurrentActionProfile(supabase, user.id);
    const moduleItem = await getOwnedModule(supabase, moduleId, user.id, profile.role);
    if (!moduleItem) return { ok: false, error: 'Modul tidak ditemukan atau bukan milik akun ini.' };

    const { error } = await supabase
      .from('modules')
      .update({
        status,
        published_at: status === 'published' ? new Date().toISOString() : null,
      })
      .eq('id', moduleItem.id);

    if (error) throw error;

    revalidateTeacherModulePaths(moduleItem.id);
    return { ok: true, moduleId: moduleItem.id };
  } catch (error) {
    return { ok: false, error: formatActionError(error, 'Status modul belum berhasil diperbarui.') };
  }
}

async function getCurrentActionProfile(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
) {
  const { data, error } = await supabase.from('profiles').select('role').eq('id', userId).maybeSingle<ProfileRoleRow>();
  if (error) throw error;
  if (!data || (data.role !== 'teacher' && data.role !== 'admin')) {
    throw new Error('Akses hanya untuk guru atau admin.');
  }

  return data;
}

async function getOwnedModule(
  supabase: Awaited<ReturnType<typeof createClient>>,
  moduleId: string,
  userId: string,
  role: AppRole,
) {
  let query = supabase
    .from('modules')
    .select('id, teacher_id, created_by, class_id, title, slug, description, cover_image_path, hero_image_path, image_crop_config, difficulty, tags, status, is_public, estimated_minutes, order_index')
    .eq('id', moduleId);

  if (role === 'teacher') {
    query = query.eq('created_by', userId);
  }

  const { data, error } = await query.maybeSingle<ModuleActionRow>();
  if (error) throw error;

  return data ?? null;
}

async function resolveUniqueModuleSlug(
  supabase: Awaited<ReturnType<typeof createClient>>,
  value: string,
) {
  const baseSlug = slugify(value);
  let candidate = baseSlug;
  let suffix = 2;

  while (true) {
    const { data, error } = await supabase.from('modules').select('id').eq('slug', candidate).limit(1);
    if (error) throw error;
    if (!data?.length) return candidate;

    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
}

async function getNextModuleOrderIndex(
  supabase: Awaited<ReturnType<typeof createClient>>,
  teacherId: string,
) {
  const { data, error } = await supabase
    .from('modules')
    .select('order_index')
    .or(`created_by.eq.${teacherId},teacher_id.eq.${teacherId}`)
    .order('order_index', { ascending: false })
    .limit(1);

  if (error) throw error;

  return Number(data?.[0]?.order_index ?? 0) + 1;
}

function revalidateTeacherModulePaths(moduleId: string) {
  revalidatePath('/teacher/dashboard');
  revalidatePath('/teacher/modules');
  revalidatePath(`/teacher/modules/${moduleId}/edit`);
  revalidatePath('/student/modules');
}

function formatActionError(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  if (!error || typeof error !== 'object') return fallback;

  const maybeError = error as { message?: string; code?: string; details?: string; hint?: string };
  return [maybeError.message, maybeError.code ? `Kode: ${maybeError.code}` : null, maybeError.details]
    .filter(Boolean)
    .join(' | ') || fallback;
}

function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');

  return slug || 'modul';
}
