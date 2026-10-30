'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';

export type LessonProgressActionResult = {
  ok: boolean;
  error?: string;
  progressPercent?: number;
};

export type QuizAnswerMap = Record<string, string>;

export type SubmitQuizAttemptInput = {
  moduleId: string;
  quizId: string;
  answers: QuizAnswerMap;
  startedAt: string;
  elapsedSeconds?: number;
};

export type SubmitQuizAttemptResult = {
  ok: boolean;
  error?: string;
  attemptId?: string;
  score?: number;
  totalPoints?: number;
  earnedPoints?: number;
  correctAnswers?: number;
  wrongAnswers?: number;
  totalQuestions?: number;
  elapsedSeconds?: number;
  passed?: boolean;
};

export type SaveQuizDraftInput = {
  moduleId: string;
  quizId: string;
  answers: QuizAnswerMap;
  startedAt: string;
};

export type SaveQuizDraftResult = {
  ok: boolean;
  error?: string;
};

export type SubmitReflectionInput = {
  moduleId: string;
  reflectionText: string;
  actionPlan: string;
};

export type SubmitReflectionResult = {
  ok: boolean;
  error?: string;
};

const reflectionSchema = z.object({
  moduleId: z.string().min(1),
  reflectionText: z.string().trim().min(30, 'Refleksi minimal 30 karakter.').max(500, 'Refleksi maksimal 500 karakter.'),
  actionPlan: z.string().trim().min(20, 'Aksi nyata minimal 20 karakter.').max(500, 'Aksi nyata maksimal 500 karakter.'),
});

const quizSchema = z.object({
  moduleId: z.string().min(1),
  quizId: z.string().min(1),
  answers: z.record(z.string(), z.string().min(1).max(500)),
  startedAt: z.string().datetime({ offset: true }),
  elapsedSeconds: z.number().finite().nonnegative().optional(),
});

const quizDraftSchema = z.object({
  moduleId: z.uuid(),
  quizId: z.uuid(),
  answers: z.record(z.string().min(1).max(64), z.string().min(1).max(500)).refine(
    (answers) => Object.keys(answers).length <= 100,
    'Jawaban kuis tidak valid.',
  ),
  startedAt: z.string().datetime({ offset: true }),
});

export async function submitReflectionAction(input: SubmitReflectionInput): Promise<SubmitReflectionResult> {
  const parsed = reflectionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Data refleksi tidak valid.' };
  if (!isSupabaseConfigured) return { ok: true };
  const { moduleId, reflectionText, actionPlan } = parsed.data;
  return saveLearningResult<SubmitReflectionResult>('submit_learning_reflection', moduleId, {
    module_id_input: moduleId, reflection_input: reflectionText, action_input: actionPlan,
  });
}

export async function markLessonCompleteAction(moduleId: string, lessonId: string): Promise<LessonProgressActionResult> {
  if (!moduleId?.trim() || !lessonId?.trim()) return { ok: false, error: 'Modul atau pelajaran tidak valid.' };
  if (!isSupabaseConfigured) return { ok: true, progressPercent: 100 };
  return saveLearningResult<LessonProgressActionResult>('complete_learning_lesson', moduleId, {
    module_id_input: moduleId, lesson_id_input: lessonId,
  });
}

export async function submitQuizAttemptAction(input: SubmitQuizAttemptInput): Promise<SubmitQuizAttemptResult> {
  const parsed = quizSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Data jawaban kuis tidak valid.' };
  if (!isSupabaseConfigured) return buildDemoQuizResult(parsed.data);
  const { moduleId, quizId, answers, startedAt } = parsed.data;
  return saveLearningResult<SubmitQuizAttemptResult>('submit_learning_quiz', moduleId, {
    module_id_input: moduleId, quiz_id_input: quizId, answers_input: answers, started_at_input: startedAt,
  });
}

export async function saveQuizDraftAction(input: SaveQuizDraftInput): Promise<SaveQuizDraftResult> {
  const parsed = quizDraftSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Data jawaban kuis tidak valid.' };
  if (!isSupabaseConfigured) return { ok: false, error: 'Penyimpanan kuis belum tersedia.' };

  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return { ok: false, error: 'Sesi siswa belum aktif. Silakan masuk kembali.' };

    const { data, error } = await supabase.rpc('save_learning_quiz_draft', {
      module_id_input: parsed.data.moduleId,
      quiz_id_input: parsed.data.quizId,
      answers_input: parsed.data.answers,
      started_at_input: parsed.data.startedAt,
    });

    if (error) return { ok: false, error: error.code === 'P0001' ? error.message : 'Jawaban belum tersimpan. Coba lagi.' };
    if (!data?.ok) return { ok: false, error: 'Jawaban belum tersimpan. Coba lagi.' };
    return { ok: true };
  } catch {
    return { ok: false, error: 'Koneksi terputus. Jawaban belum tersimpan; coba pilih kembali.' };
  }
}

async function saveLearningResult<T extends { ok: boolean; error?: string }>(
  procedure: string,
  moduleId: string,
  args: Record<string, unknown>,
): Promise<T> {
  if (!z.uuid().safeParse(moduleId).success) return { ok: false, error: 'Modul tidak valid.' } as T;
  try {
    const supabase = await createClient();
    // The RPC authenticates auth.uid(), checks ownership, and commits all learning writes together.
    const { data, error } = await supabase.rpc(procedure, args);
    if (error) return { ok: false, error: error.code === 'P0001' ? error.message : 'Hasil belum tersimpan. Silakan coba lagi.' } as T;
    if (!data?.ok) return { ok: false, error: 'Hasil belum tersimpan. Silakan coba lagi.' } as T;
    revalidatePath(`/student/modules/${moduleId}`, 'layout');
    for (const path of ['/student/dashboard', '/student/modules', '/student/progress', '/student/quizzes', '/student/reflection']) {
      revalidatePath(path);
    }
    return data as T;
  } catch {
    return { ok: false, error: 'Koneksi terputus. Silakan coba simpan kembali.' } as T;
  }
}

function buildDemoQuizResult(input: SubmitQuizAttemptInput): SubmitQuizAttemptResult {
  const totalQuestions = Math.max(Object.keys(input.answers).length, 1);
  const correctAnswers = Object.values(input.answers).filter((answer) => answer === 'b').length;
  const totalPoints = 100;
  const score = Math.round((correctAnswers / totalQuestions) * 100);
  const earnedPoints = score;

  return {
    ok: true,
    attemptId: 'demo-attempt',
    score,
    totalPoints,
    earnedPoints,
    correctAnswers,
    wrongAnswers: Math.max(totalQuestions - correctAnswers, 0),
    totalQuestions,
    elapsedSeconds: input.elapsedSeconds ?? 0,
    passed: score >= 70,
  };
}
