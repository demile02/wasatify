'use server';

import { revalidatePath } from 'next/cache';
import { normalizeCorrectAnswer } from '@/lib/student/learning';
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
  correctAnswers?: number;
  wrongAnswers?: number;
  totalQuestions?: number;
  elapsedSeconds?: number;
  passed?: boolean;
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

type QuizRow = {
  id: string;
  module_id: string;
  passing_score: number | null;
};

type QuestionRow = {
  id: string;
  correct_answer: unknown;
};

type ModuleProgressRow = {
  status: 'completed' | 'in_progress' | 'not_started' | 'locked' | null;
  progress_percent: number | null;
  completed_at: string | null;
};

export async function submitReflectionAction(input: SubmitReflectionInput): Promise<SubmitReflectionResult> {
  const moduleId = input.moduleId.trim();
  const reflectionText = input.reflectionText.trim();
  const actionPlan = input.actionPlan.trim();

  if (!moduleId) {
    return { ok: false, error: 'Pilih modul terlebih dahulu.' };
  }

  if (!reflectionText || !actionPlan) {
    return { ok: false, error: 'Refleksi dan aksi nyata wajib diisi.' };
  }

  if (reflectionText.length > 500 || actionPlan.length > 500) {
    return { ok: false, error: 'Refleksi dan aksi nyata maksimal 500 karakter.' };
  }

  if (!isSupabaseConfigured) {
    return { ok: true };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { ok: false, error: 'Sesi refleksi belum aktif. Silakan masuk kembali.' };
    }

    const now = new Date().toISOString();
    const { error: reflectionError } = await supabase.from('reflections').upsert(
      {
        student_id: user.id,
        module_id: moduleId,
        reflection_text: reflectionText,
        action_plan: actionPlan,
      },
      { onConflict: 'student_id,module_id' },
    );

    if (reflectionError) throw reflectionError;

    const { data: existingProgress } = await supabase
      .from('module_progress')
      .select('status, progress_percent, completed_at')
      .eq('student_id', user.id)
      .eq('module_id', moduleId)
      .maybeSingle<ModuleProgressRow>();

    const alreadyCompleted = existingProgress?.status === 'completed' || Boolean(existingProgress?.completed_at);
    const nextProgressPercent = alreadyCompleted ? 100 : Math.max(existingProgress?.progress_percent ?? 0, 90);

    const { error: moduleProgressError } = await supabase.from('module_progress').upsert(
      {
        student_id: user.id,
        module_id: moduleId,
        status: alreadyCompleted ? 'completed' : 'in_progress',
        progress_percent: nextProgressPercent,
        started_at: now,
        completed_at: alreadyCompleted ? existingProgress?.completed_at ?? now : null,
        last_accessed_at: now,
      },
      { onConflict: 'student_id,module_id' },
    );

    if (moduleProgressError) throw moduleProgressError;

    revalidatePath('/student/reflection');
    revalidatePath('/student/progress');
    revalidatePath('/student/modules');
    revalidatePath('/student/dashboard');

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Gagal menyimpan refleksi.',
    };
  }
}

export async function markLessonCompleteAction(
  moduleId: string,
  lessonId: string,
): Promise<LessonProgressActionResult> {
  if (!isSupabaseConfigured) {
    return { ok: true, progressPercent: 80 };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { ok: false, error: 'Sesi belajar belum aktif. Silakan masuk kembali.' };
    }

    const now = new Date().toISOString();
    const { error: progressError } = await supabase.from('lesson_progress').upsert(
      {
        student_id: user.id,
        module_id: moduleId,
        lesson_id: lessonId,
        completed_at: now,
      },
      { onConflict: 'student_id,lesson_id' },
    );

    if (progressError) throw progressError;

    const [lessonCountResult, completedCountResult, existingProgressResult] = await Promise.all([
      supabase.from('lessons').select('id', { count: 'exact', head: true }).eq('module_id', moduleId),
      supabase
        .from('lesson_progress')
        .select('id', { count: 'exact', head: true })
        .eq('student_id', user.id)
        .eq('module_id', moduleId)
        .not('completed_at', 'is', null),
      supabase
        .from('module_progress')
        .select('status, progress_percent, completed_at')
        .eq('student_id', user.id)
        .eq('module_id', moduleId)
        .maybeSingle<ModuleProgressRow>(),
    ]);

    const totalLessons = lessonCountResult.count ?? 0;
    const completedLessons = completedCountResult.count ?? 0;
    const lessonProgressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 80) : 20;
    const existingProgress = existingProgressResult.data;
    const alreadyCompleted = existingProgress?.status === 'completed' || Boolean(existingProgress?.completed_at);
    const nextProgressPercent = alreadyCompleted
      ? 100
      : Math.max(existingProgress?.progress_percent ?? 0, Math.min(lessonProgressPercent, 80));

    const { error: moduleProgressError } = await supabase.from('module_progress').upsert(
      {
        student_id: user.id,
        module_id: moduleId,
        status: alreadyCompleted ? 'completed' : 'in_progress',
        progress_percent: nextProgressPercent,
        started_at: now,
        completed_at: alreadyCompleted ? existingProgress?.completed_at ?? now : null,
        last_accessed_at: now,
      },
      { onConflict: 'student_id,module_id' },
    );

    if (moduleProgressError) throw moduleProgressError;

    revalidatePath(`/student/modules/${moduleId}`);
    revalidatePath('/student/modules');
    revalidatePath('/student/dashboard');

    return { ok: true, progressPercent: nextProgressPercent };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Gagal menyimpan progress lesson.',
    };
  }
}

export async function submitQuizAttemptAction(
  input: SubmitQuizAttemptInput,
): Promise<SubmitQuizAttemptResult> {
  if (!isSupabaseConfigured) {
    return buildDemoQuizResult(input);
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { ok: false, error: 'Sesi kuis belum aktif. Silakan masuk kembali.' };
    }

    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select('id, module_id, passing_score')
      .eq('id', input.quizId)
      .maybeSingle<QuizRow>();

    if (quizError) throw quizError;
    if (!quiz) {
      return { ok: false, error: 'Kuis tidak ditemukan.' };
    }

    const { data: questionRows, error: questionError } = await supabase
      .from('quiz_questions')
      .select('id, correct_answer')
      .eq('quiz_id', quiz.id);

    if (questionError) throw questionError;

    const questions = (questionRows ?? []) as QuestionRow[];
    if (!questions.length) {
      return { ok: false, error: 'Kuis belum memiliki pertanyaan.' };
    }

    const totalQuestions = questions.length;
    const correctAnswers = questions.reduce((total, question) => {
      const expected = normalizeCorrectAnswer(question.correct_answer);
      const selected = input.answers[question.id] ?? '';
      return total + (selected === expected ? 1 : 0);
    }, 0);
    const score = Math.round((correctAnswers / totalQuestions) * 100);
    const wrongAnswers = Math.max(totalQuestions - correctAnswers, 0);
    const passed = score >= (quiz.passing_score ?? 70);
    const submittedAt = new Date();
    const startedAt = parseStartedAt(input.startedAt, submittedAt);
    const elapsedSeconds = Math.max(
      input.elapsedSeconds ?? Math.round((submittedAt.getTime() - startedAt.getTime()) / 1000),
      0,
    );

    const { data: attempt, error: attemptError } = await supabase
      .from('quiz_attempts')
      .insert({
        quiz_id: quiz.id,
        student_id: user.id,
        status: 'graded',
        answers: input.answers,
        score,
        total_questions: totalQuestions,
        correct_answers: correctAnswers,
        started_at: startedAt.toISOString(),
        submitted_at: submittedAt.toISOString(),
      })
      .select('id')
      .single<{ id: string }>();

    if (attemptError) throw attemptError;

    if (passed) {
      const now = submittedAt.toISOString();
      const { error: moduleProgressError } = await supabase.from('module_progress').upsert(
        {
          student_id: user.id,
          module_id: quiz.module_id,
          status: 'completed',
          progress_percent: 100,
          started_at: startedAt.toISOString(),
          completed_at: now,
          last_accessed_at: now,
        },
        { onConflict: 'student_id,module_id' },
      );

      if (moduleProgressError) throw moduleProgressError;
    }

    revalidatePath(`/student/modules/${quiz.module_id}`);
    revalidatePath(`/student/modules/${quiz.module_id}/quiz/result`);
    revalidatePath('/student/modules');
    revalidatePath('/student/dashboard');

    return {
      ok: true,
      attemptId: attempt.id,
      score,
      correctAnswers,
      wrongAnswers,
      totalQuestions,
      elapsedSeconds,
      passed,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Gagal menyimpan hasil kuis.',
    };
  }
}

function parseStartedAt(startedAt: string, fallback: Date) {
  const parsed = new Date(startedAt);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

function buildDemoQuizResult(input: SubmitQuizAttemptInput): SubmitQuizAttemptResult {
  const totalQuestions = Math.max(Object.keys(input.answers).length, 1);
  const correctAnswers = Object.values(input.answers).filter((answer) => answer === 'b').length;
  const score = Math.round((correctAnswers / totalQuestions) * 100);

  return {
    ok: true,
    attemptId: 'demo-attempt',
    score,
    correctAnswers,
    wrongAnswers: Math.max(totalQuestions - correctAnswers, 0),
    totalQuestions,
    elapsedSeconds: input.elapsedSeconds ?? 0,
    passed: score >= 70,
  };
}
