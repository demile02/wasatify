'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getStudentAvailableModuleIds } from '@/lib/scope';
import { normalizeCorrectAnswer } from '@/lib/student/learning';
import { recordStudentActivity } from '@/lib/student/streak';
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
  max_attempts: number | null;
  allow_retake: boolean | null;
};

type QuestionRow = {
  id: string;
  correct_answer: unknown;
  points: number | null;
};

type ExistingAttemptRow = {
  id: string;
  score: number | null;
  passed: boolean | null;
};

type ModuleProgressRow = {
  status: 'completed' | 'in_progress' | 'not_started' | 'locked' | null;
  progress_percent: number | null;
  completed_at: string | null;
};

type QuizAvailabilityRow = {
  id: string;
  status: 'draft' | 'published' | 'archived' | null;
  is_published: boolean | null;
};

const submitReflectionSchema = z.object({
  moduleId: z.string().min(1, 'Pilih modul terlebih dahulu.'),
  reflectionText: z
    .string()
    .trim()
    .min(30, 'Refleksi minimal 30 karakter.')
    .max(500, 'Refleksi maksimal 500 karakter.'),
  actionPlan: z
    .string()
    .trim()
    .min(20, 'Aksi nyata minimal 20 karakter.')
    .max(500, 'Aksi nyata maksimal 500 karakter.'),
});

const submitQuizAttemptSchema = z.object({
  moduleId: z.string().min(1),
  quizId: z.string().min(1),
  answers: z.record(z.string(), z.string().min(1)),
  startedAt: z.string().min(1),
  elapsedSeconds: z.number().nonnegative().optional(),
});

export async function submitReflectionAction(input: SubmitReflectionInput): Promise<SubmitReflectionResult> {
  const parsed = submitReflectionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Data refleksi tidak valid.' };
  }

  const { moduleId, reflectionText, actionPlan } = parsed.data;

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

    if (!(await canStudentAccessModule(user.id, moduleId))) {
      return { ok: false, error: 'Modul ini tidak tersedia untuk kelasmu.' };
    }

    const now = new Date().toISOString();
    const { data: existingReflection, error: existingReflectionError } = await supabase
      .from('reflections')
      .select('id')
      .eq('student_id', user.id)
      .eq('module_id', moduleId)
      .maybeSingle<{ id: string }>();

    if (existingReflectionError) throw existingReflectionError;

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

    const [existingProgressResult, lessonCountResult, completedLessonCountResult, quizResult, passedAttemptResult] =
      await Promise.all([
        supabase
          .from('module_progress')
          .select('status, progress_percent, completed_at')
          .eq('student_id', user.id)
          .eq('module_id', moduleId)
          .maybeSingle<ModuleProgressRow>(),
        supabase.from('lessons').select('id', { count: 'exact', head: true }).eq('module_id', moduleId),
        supabase
          .from('lesson_progress')
          .select('id', { count: 'exact', head: true })
          .eq('student_id', user.id)
          .eq('module_id', moduleId)
          .not('completed_at', 'is', null),
        supabase.from('quizzes').select('id, status, is_published').eq('module_id', moduleId),
        supabase
          .from('quiz_attempts')
          .select('id', { count: 'exact', head: true })
          .eq('student_id', user.id)
          .eq('passed', true)
          .in(
            'quiz_id',
            (
              await supabase
                .from('quizzes')
                .select('id')
                .eq('module_id', moduleId)
                .eq('is_published', true)
            ).data?.map((quiz) => quiz.id) ?? ['00000000-0000-0000-0000-000000000000'],
          ),
      ]);

    const existingProgress = existingProgressResult.data;
    const alreadyCompleted = existingProgress?.status === 'completed' || Boolean(existingProgress?.completed_at);
    const totalLessons = lessonCountResult.count ?? 0;
    const completedLessons = completedLessonCountResult.count ?? 0;
    const allLessonsCompleted = totalLessons === 0 || completedLessons >= totalLessons;
    const hasPublishedQuiz = ((quizResult.data ?? []) as QuizAvailabilityRow[]).some(
      (quiz) => quiz.status === 'published' || quiz.is_published,
    );
    const quizRequirementMet = hasPublishedQuiz ? (passedAttemptResult.count ?? 0) > 0 : true;
    const shouldComplete = alreadyCompleted || (allLessonsCompleted && quizRequirementMet);
    const nextProgressPercent = shouldComplete ? 100 : Math.max(existingProgress?.progress_percent ?? 0, 90);

    const { error: moduleProgressError } = await supabase.from('module_progress').upsert(
      {
        student_id: user.id,
        module_id: moduleId,
        status: shouldComplete ? 'completed' : 'in_progress',
        progress_percent: nextProgressPercent,
        started_at: now,
        completed_at: shouldComplete ? existingProgress?.completed_at ?? now : null,
        last_accessed_at: now,
      },
      { onConflict: 'student_id,module_id' },
    );

    if (moduleProgressError) throw moduleProgressError;

    if (!existingReflection) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('xp')
        .eq('id', user.id)
        .maybeSingle<{ xp: number | null }>();

      await supabase
        .from('profiles')
        .update({ xp: (profile?.xp ?? 0) + 20 })
        .eq('id', user.id);
    }

    await recordStudentActivity(user.id, now);

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
  const normalizedModuleId = moduleId.trim();
  const normalizedLessonId = lessonId.trim();

  if (!normalizedModuleId || !normalizedLessonId) {
    return { ok: false, error: 'Modul atau lesson tidak valid.' };
  }

  if (!isSupabaseConfigured) {
    return { ok: true, progressPercent: 100 };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { ok: false, error: 'Sesi belajar belum aktif. Silakan masuk kembali.' };
    }

    if (!(await canStudentAccessModule(user.id, normalizedModuleId))) {
      return { ok: false, error: 'Modul ini tidak tersedia untuk kelasmu.' };
    }

    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select('id')
      .eq('id', normalizedLessonId)
      .eq('module_id', normalizedModuleId)
      .maybeSingle<{ id: string }>();

    if (lessonError) throw lessonError;
    if (!lesson) {
      return { ok: false, error: 'Lesson tidak ditemukan pada modul ini.' };
    }

    const now = new Date().toISOString();
    const { error: progressError } = await supabase.from('lesson_progress').upsert(
      {
        student_id: user.id,
        module_id: normalizedModuleId,
        lesson_id: normalizedLessonId,
        completed_at: now,
      },
      { onConflict: 'student_id,lesson_id' },
    );

    if (progressError) throw progressError;

    const [lessonCountResult, completedCountResult, existingProgressResult, quizResult] = await Promise.all([
      supabase.from('lessons').select('id', { count: 'exact', head: true }).eq('module_id', normalizedModuleId),
      supabase
        .from('lesson_progress')
        .select('id', { count: 'exact', head: true })
        .eq('student_id', user.id)
        .eq('module_id', normalizedModuleId)
        .not('completed_at', 'is', null),
      supabase
        .from('module_progress')
        .select('status, progress_percent, completed_at')
        .eq('student_id', user.id)
        .eq('module_id', normalizedModuleId)
        .maybeSingle<ModuleProgressRow>(),
      supabase.from('quizzes').select('id, status, is_published').eq('module_id', normalizedModuleId),
    ]);

    const totalLessons = lessonCountResult.count ?? 0;
    const completedLessons = completedCountResult.count ?? 0;
    const lessonProgressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
    const existingProgress = existingProgressResult.data;
    const alreadyCompleted = existingProgress?.status === 'completed' || Boolean(existingProgress?.completed_at);
    const hasPublishedQuiz = ((quizResult.data ?? []) as QuizAvailabilityRow[]).some(
      (quiz) => quiz.status === 'published' || quiz.is_published,
    );
    const allLessonsCompleted = totalLessons > 0 && completedLessons >= totalLessons;
    const shouldCompleteModule = allLessonsCompleted && !hasPublishedQuiz;
    const nextProgressPercent = alreadyCompleted || shouldCompleteModule
      ? 100
      : Math.max(existingProgress?.progress_percent ?? 0, lessonProgressPercent);
    const nextStatus = alreadyCompleted || shouldCompleteModule ? 'completed' : 'in_progress';

    const { error: moduleProgressError } = await supabase.from('module_progress').upsert(
      {
        student_id: user.id,
        module_id: normalizedModuleId,
        status: nextStatus,
        progress_percent: nextProgressPercent,
        started_at: now,
        completed_at: nextStatus === 'completed' ? existingProgress?.completed_at ?? now : null,
        last_accessed_at: now,
      },
      { onConflict: 'student_id,module_id' },
    );

    if (moduleProgressError) throw moduleProgressError;

    await recordStudentActivity(user.id, now);

    revalidatePath(`/student/modules/${normalizedModuleId}`);
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
  const parsed = submitQuizAttemptSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: 'Data jawaban kuis tidak valid.' };
  }

  const payload = parsed.data;

  if (!isSupabaseConfigured) {
    return buildDemoQuizResult(payload);
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { ok: false, error: 'Sesi kuis belum aktif. Silakan masuk kembali.' };
    }

    if (!(await canStudentAccessModule(user.id, payload.moduleId))) {
      return { ok: false, error: 'Modul ini tidak tersedia untuk kelasmu.' };
    }

    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select('id, module_id, passing_score, max_attempts, allow_retake')
      .eq('id', payload.quizId)
      .maybeSingle<QuizRow>();

    if (quizError) throw quizError;
    if (!quiz) {
      return { ok: false, error: 'Kuis tidak ditemukan.' };
    }
    if (quiz.module_id !== payload.moduleId) {
      return { ok: false, error: 'Kuis tidak sesuai dengan modul.' };
    }

    const maxAttempts = Math.max(quiz.max_attempts ?? 3, 1);
    const allowRetake = maxAttempts > 1 && Boolean(quiz.allow_retake ?? true);
    const { data: existingAttempts, error: existingAttemptsError } = await supabase
      .from('quiz_attempts')
      .select('id, score, passed')
      .eq('quiz_id', quiz.id)
      .eq('student_id', user.id);

    if (existingAttemptsError) throw existingAttemptsError;

    const previousAttempts = (existingAttempts ?? []) as ExistingAttemptRow[];
    if (previousAttempts.length >= maxAttempts || (!allowRetake && previousAttempts.length >= 1)) {
      return { ok: false, error: 'Kesempatan kuis sudah habis.' };
    }

    const { data: questionRows, error: questionError } = await supabase
      .from('quiz_questions')
      .select('id, correct_answer, points')
      .eq('quiz_id', quiz.id);

    if (questionError) throw questionError;

    const questions = (questionRows ?? []) as QuestionRow[];
    if (!questions.length) {
      return { ok: false, error: 'Kuis belum memiliki pertanyaan.' };
    }

    const unansweredQuestion = questions.find((question) => !payload.answers[question.id]);
    if (unansweredQuestion) {
      return { ok: false, error: 'Masih ada pertanyaan yang belum dijawab.' };
    }

    const totalQuestions = questions.length;
    const totalPoints = questions.reduce((total, question) => total + (question.points ?? 10), 0);
    const { correctAnswers, earnedPoints } = questions.reduce(
      (result, question) => {
        const expected = normalizeCorrectAnswer(question.correct_answer);
        const selected = payload.answers[question.id] ?? '';
        if (selected !== expected) return result;
        return {
          correctAnswers: result.correctAnswers + 1,
          earnedPoints: result.earnedPoints + (question.points ?? 10),
        };
      },
      { correctAnswers: 0, earnedPoints: 0 },
    );
    const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    const wrongAnswers = Math.max(totalQuestions - correctAnswers, 0);
    const passed = score >= (quiz.passing_score ?? 70);
    const alreadyPassed = previousAttempts.some((attempt) => attempt.passed || Number(attempt.score ?? 0) >= (quiz.passing_score ?? 70));
    const submittedAt = new Date();
    const startedAt = parseStartedAt(payload.startedAt, submittedAt);
    const elapsedSeconds = Math.max(
      payload.elapsedSeconds ?? Math.round((submittedAt.getTime() - startedAt.getTime()) / 1000),
      0,
    );

    const { data: attempt, error: attemptError } = await supabase
      .from('quiz_attempts')
      .insert({
        quiz_id: quiz.id,
        student_id: user.id,
        status: 'graded',
        answers: payload.answers,
        score,
        total_points: totalPoints,
        earned_points: earnedPoints,
        passed,
        total_questions: totalQuestions,
        correct_answers: correctAnswers,
        started_at: startedAt.toISOString(),
        submitted_at: submittedAt.toISOString(),
      })
      .select('id')
      .single<{ id: string }>();

    if (attemptError) throw attemptError;

    await recordStudentActivity(user.id, submittedAt);

    if (passed) {
      const now = submittedAt.toISOString();
      const [lessonCountResult, completedLessonCountResult, existingProfileResult] = await Promise.all([
        supabase.from('lessons').select('id', { count: 'exact', head: true }).eq('module_id', quiz.module_id),
        supabase
          .from('lesson_progress')
          .select('id', { count: 'exact', head: true })
          .eq('student_id', user.id)
          .eq('module_id', quiz.module_id)
          .not('completed_at', 'is', null),
        supabase.from('profiles').select('xp').eq('id', user.id).maybeSingle<{ xp: number | null }>(),
      ]);

      const totalLessons = lessonCountResult.count ?? 0;
      const completedLessons = completedLessonCountResult.count ?? 0;
      const allLessonsCompleted = totalLessons === 0 || completedLessons >= totalLessons;
      const { error: moduleProgressError } = await supabase.from('module_progress').upsert(
        {
          student_id: user.id,
          module_id: quiz.module_id,
          status: allLessonsCompleted ? 'completed' : 'in_progress',
          progress_percent: allLessonsCompleted
            ? 100
            : Math.max(90, Math.round((completedLessons / Math.max(totalLessons, 1)) * 100)),
          started_at: startedAt.toISOString(),
          completed_at: allLessonsCompleted ? now : null,
          last_accessed_at: now,
        },
        { onConflict: 'student_id,module_id' },
      );

      if (moduleProgressError) throw moduleProgressError;

      if (!alreadyPassed) {
        const currentXp = existingProfileResult.data?.xp ?? 0;
        await supabase
          .from('profiles')
          .update({ xp: currentXp + 50 })
          .eq('id', user.id);
      }
    }

    revalidatePath(`/student/modules/${quiz.module_id}`);
    revalidatePath(`/student/modules/${quiz.module_id}/quiz/result`);
    revalidatePath('/student/modules');
    revalidatePath('/student/dashboard');

    return {
      ok: true,
      attemptId: attempt.id,
      score,
      totalPoints,
      earnedPoints,
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

async function canStudentAccessModule(studentId: string, moduleId: string) {
  const moduleIds = await getStudentAvailableModuleIds(studentId);
  return moduleIds.includes(moduleId);
}

function buildDemoQuizResult(input: SubmitQuizAttemptInput): SubmitQuizAttemptResult {
  const totalQuestions = Math.max(Object.keys(input.answers).length, 1);
  const correctAnswers = Object.values(input.answers).filter((answer) => answer === 'b').length;
  const totalPoints = totalQuestions * 10;
  const earnedPoints = correctAnswers * 10;
  const score = Math.round((earnedPoints / totalPoints) * 100);

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
