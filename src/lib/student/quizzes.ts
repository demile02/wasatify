import { demoStudentModules, type StudentModule } from '@/lib/demo/student';
import { getStudentModules } from '@/lib/student/data';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import type { Profile } from '@/lib/types';

export type StudentQuizCenterQuiz = {
  id: string;
  moduleId: string;
  moduleTitle: string;
  moduleProgress: number;
  moduleStatus: StudentModule['status'];
  title: string;
  description: string | null;
  category: string;
  passingScore: number;
  maxAttempts: number;
  allowRetake: boolean;
  attemptsUsed: number;
  bestScore: number | null;
  latestAttemptId: string | null;
  latestScore: number | null;
  hasPassed: boolean;
  hasReflection: boolean;
  canAttempt: boolean;
  prerequisiteMet: boolean;
};

export type StudentQuizHistoryItem = {
  id: string;
  quizId: string;
  moduleId: string;
  moduleTitle: string;
  quizTitle: string;
  attemptNumber: number;
  score: number;
  passed: boolean;
  submittedAt: string;
  bestScore: number;
};

export type StudentQuizCenterData = {
  available: StudentQuizCenterQuiz[];
  waiting: StudentQuizCenterQuiz[];
  exhausted: StudentQuizCenterQuiz[];
  history: StudentQuizHistoryItem[];
  isDemo: boolean;
};

type QuizRow = {
  id: string;
  module_id: string;
  title: string;
  description: string | null;
  passing_score: number | null;
  max_attempts: number | null;
  allow_retake: boolean | null;
};

type AttemptRow = {
  id: string;
  quiz_id: string;
  score: number | null;
  passed: boolean | null;
  submitted_at: string | null;
  created_at: string;
};

type ReflectionRow = {
  module_id: string;
};

export async function getStudentQuizCenterData(profile: Profile): Promise<StudentQuizCenterData> {
  if (!isSupabaseConfigured) return demoQuizCenterData();

  try {
    const supabase = await createClient();
    const modules = await getStudentModules(profile);
    const moduleIds = modules.map((moduleItem) => moduleItem.id);
    if (!moduleIds.length) {
      return { available: [], waiting: [], exhausted: [], history: [], isDemo: false };
    }

    const [quizzesResult, attemptsResult, reflectionsResult] = await Promise.all([
      supabase
        .from('quizzes')
        .select('id, module_id, title, description, passing_score, max_attempts, allow_retake')
        .in('module_id', moduleIds)
        .eq('is_published', true)
        .order('created_at', { ascending: true }),
      supabase
        .from('quiz_attempts')
        .select('id, quiz_id, score, passed, submitted_at, created_at')
        .eq('student_id', profile.id)
        .order('submitted_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false }),
      supabase.from('reflections').select('module_id').eq('student_id', profile.id).in('module_id', moduleIds),
    ]);

    if (quizzesResult.error || attemptsResult.error || reflectionsResult.error) {
      throw quizzesResult.error ?? attemptsResult.error ?? reflectionsResult.error;
    }

    const moduleById = new Map(modules.map((moduleItem) => [moduleItem.id, moduleItem]));
    const reflectionModuleIds = new Set(((reflectionsResult.data ?? []) as ReflectionRow[]).map((row) => row.module_id));
    const attemptsByQuiz = groupAttemptsByQuiz((attemptsResult.data ?? []) as AttemptRow[]);
    const quizItems = ((quizzesResult.data ?? []) as QuizRow[])
      .map((quiz) => mapQuizRow(quiz, moduleById, attemptsByQuiz.get(quiz.id) ?? [], reflectionModuleIds))
      .filter(Boolean) as StudentQuizCenterQuiz[];

    const history = buildQuizHistory(quizItems, attemptsByQuiz);

    return {
      available: quizItems.filter((quiz) => quiz.prerequisiteMet && quiz.canAttempt),
      waiting: quizItems.filter((quiz) => !quiz.prerequisiteMet),
      exhausted: quizItems.filter((quiz) => quiz.prerequisiteMet && !quiz.canAttempt),
      history,
      isDemo: false,
    };
  } catch {
    return { available: [], waiting: [], exhausted: [], history: [], isDemo: false };
  }
}

function mapQuizRow(
  quiz: QuizRow,
  moduleById: Map<string, StudentModule>,
  attempts: AttemptRow[],
  reflectionModuleIds: Set<string>,
) {
  const moduleItem = moduleById.get(quiz.module_id);
  if (!moduleItem) return null;

  const maxAttempts = Math.max(quiz.max_attempts ?? 3, 1);
  const allowRetake = maxAttempts > 1 && Boolean(quiz.allow_retake ?? true);
  const attemptsUsed = attempts.length;
  const scores = attempts.map((attempt) => Math.round(Number(attempt.score ?? 0)));
  const bestScore = scores.length ? Math.max(...scores) : null;
  const latestAttempt = attempts[0] ?? null;
  const latestScore = latestAttempt?.score === null || latestAttempt?.score === undefined ? null : Math.round(Number(latestAttempt.score));
  const hasPassed = attempts.some((attempt) => Boolean(attempt.passed) || Number(attempt.score ?? 0) >= (quiz.passing_score ?? 70));
  const prerequisiteMet = moduleItem.status === 'completed' || moduleItem.progress >= 100;

  return {
    id: quiz.id,
    moduleId: moduleItem.id,
    moduleTitle: moduleItem.title,
    moduleProgress: moduleItem.progress,
    moduleStatus: moduleItem.status,
    title: quiz.title,
    description: quiz.description,
    category: 'Kuis Modul',
    passingScore: quiz.passing_score ?? 70,
    maxAttempts,
    allowRetake,
    attemptsUsed,
    bestScore,
    latestAttemptId: latestAttempt?.id ?? null,
    latestScore,
    hasPassed,
    hasReflection: reflectionModuleIds.has(moduleItem.id),
    canAttempt: attemptsUsed === 0 || (allowRetake && attemptsUsed < maxAttempts),
    prerequisiteMet,
  } satisfies StudentQuizCenterQuiz;
}

function groupAttemptsByQuiz(attempts: AttemptRow[]) {
  const map = new Map<string, AttemptRow[]>();
  for (const attempt of attempts) {
    const rows = map.get(attempt.quiz_id) ?? [];
    rows.push(attempt);
    map.set(attempt.quiz_id, rows);
  }

  return map;
}

function buildQuizHistory(
  quizzes: StudentQuizCenterQuiz[],
  attemptsByQuiz: Map<string, AttemptRow[]>,
): StudentQuizHistoryItem[] {
  const quizById = new Map(quizzes.map((quiz) => [quiz.id, quiz]));
  const items: StudentQuizHistoryItem[] = [];

  for (const [quizId, attempts] of attemptsByQuiz.entries()) {
    const quiz = quizById.get(quizId);
    if (!quiz) continue;
    const chronologicalAttempts = [...attempts].sort(
      (first, second) =>
        new Date(first.submitted_at ?? first.created_at).getTime() -
        new Date(second.submitted_at ?? second.created_at).getTime(),
    );
    const attemptNumberById = new Map(chronologicalAttempts.map((attempt, index) => [attempt.id, index + 1]));
    const bestScore = Math.max(...attempts.map((attempt) => Math.round(Number(attempt.score ?? 0))));

    for (const attempt of attempts) {
      items.push({
        id: attempt.id,
        quizId,
        moduleId: quiz.moduleId,
        moduleTitle: quiz.moduleTitle,
        quizTitle: quiz.title,
        attemptNumber: attemptNumberById.get(attempt.id) ?? 1,
        score: Math.round(Number(attempt.score ?? 0)),
        passed: Boolean(attempt.passed) || Number(attempt.score ?? 0) >= quiz.passingScore,
        submittedAt: attempt.submitted_at ?? attempt.created_at,
        bestScore,
      });
    }
  }

  return items.sort((first, second) => new Date(second.submittedAt).getTime() - new Date(first.submittedAt).getTime());
}

function demoQuizCenterData(): StudentQuizCenterData {
  const [completedModule, activeModule, waitingModule] = demoStudentModules;
  const available = activeModule
    ? [
        {
          id: 'demo-quiz-active',
          moduleId: activeModule.id,
          moduleTitle: activeModule.title,
          moduleProgress: 100,
          moduleStatus: 'in_progress' as const,
          title: 'Kuis Pemahaman Pedoman Hidup',
          description: 'Uji pemahaman setelah menyelesaikan materi utama.',
          category: 'Kuis Modul',
          passingScore: 70,
          maxAttempts: 3,
          allowRetake: true,
          attemptsUsed: 0,
          bestScore: null,
          latestAttemptId: null,
          latestScore: null,
          hasPassed: false,
          hasReflection: false,
          canAttempt: true,
          prerequisiteMet: true,
        },
      ]
    : [];

  const waiting = waitingModule
    ? [
        {
          id: 'demo-quiz-waiting',
          moduleId: waitingModule.id,
          moduleTitle: waitingModule.title,
          moduleProgress: waitingModule.progress,
          moduleStatus: waitingModule.status,
          title: 'Kuis Akhlak dalam Islam',
          description: 'Selesaikan materi terlebih dahulu untuk membuka kuis.',
          category: 'Kuis Modul',
          passingScore: 70,
          maxAttempts: 3,
          allowRetake: true,
          attemptsUsed: 0,
          bestScore: null,
          latestAttemptId: null,
          latestScore: null,
          hasPassed: false,
          hasReflection: false,
          canAttempt: true,
          prerequisiteMet: false,
        },
      ]
    : [];

  const history = completedModule
    ? [
        {
          id: 'demo-attempt-1',
          quizId: 'demo-quiz-completed',
          moduleId: completedModule.id,
          moduleTitle: completedModule.title,
          quizTitle: 'Kuis Pengantar Wasathiyah',
          attemptNumber: 1,
          score: 90,
          passed: true,
          submittedAt: new Date().toISOString(),
          bestScore: 90,
        },
      ]
    : [];

  return { available, waiting, exhausted: [], history, isDemo: true };
}
