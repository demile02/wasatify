import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import type { Profile } from '@/lib/types';

export type TeacherQuizStatus = 'published' | 'draft' | 'archived';
export type TeacherQuizModuleStatus = 'published' | 'draft' | 'archived';

export type TeacherQuizAttemptItem = {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string | null;
  score: number | null;
  passed: boolean;
  submittedAt: string | null;
  createdAt: string | null;
};

export type TeacherQuizListItem = {
  id: string;
  title: string;
  description: string | null;
  moduleId: string;
  moduleTitle: string;
  moduleStatus: TeacherQuizModuleStatus;
  questionCount: number;
  passingGrade: number;
  maxAttempts: number;
  allowRetake: boolean;
  attemptCount: number;
  averageScore: number | null;
  bestScore: number | null;
  status: TeacherQuizStatus;
  isPublished: boolean;
  attempts: TeacherQuizAttemptItem[];
};

export type TeacherQuizModuleOption = {
  id: string;
  title: string;
};

export type TeacherQuizzesData = {
  quizzes: TeacherQuizListItem[];
  modules: TeacherQuizModuleOption[];
  isDemo: boolean;
};

type ModuleRow = {
  id: string;
  title: string;
  status: TeacherQuizModuleStatus;
};

type QuizRow = {
  id: string;
  module_id: string;
  title: string;
  description: string | null;
  passing_score: number | null;
  max_attempts: number | null;
  allow_retake: boolean | null;
  status: TeacherQuizStatus | null;
  is_published: boolean | null;
};

type QuestionRow = {
  id: string;
  quiz_id: string;
};

type AttemptRow = {
  id: string;
  quiz_id: string;
  student_id: string;
  score: number | null;
  passed: boolean | null;
  submitted_at: string | null;
  created_at: string | null;
};

type StudentRow = {
  id: string;
  full_name: string;
  email: string | null;
};

export async function getTeacherQuizzes(profile: Profile): Promise<TeacherQuizzesData> {
  if (!isSupabaseConfigured) return buildDemoTeacherQuizzes();

  try {
    const supabase = await createClient();
    let moduleQuery = supabase
      .from('modules')
      .select('id, title, status')
      .order('order_index', { ascending: true })
      .order('updated_at', { ascending: false });

    if (profile.role === 'teacher') {
      moduleQuery = moduleQuery.eq('created_by', profile.id);
    }

    const { data: moduleRows, error: moduleError } = await moduleQuery;
    if (moduleError) throw moduleError;

    const modules = (moduleRows ?? []) as ModuleRow[];
    const moduleIds = modules.map((moduleItem) => moduleItem.id);
    if (!moduleIds.length) {
      return { quizzes: [], modules: [], isDemo: false };
    }

    const { data: quizRows, error: quizError } = await supabase
      .from('quizzes')
      .select('id, module_id, title, description, passing_score, max_attempts, allow_retake, status, is_published')
      .in('module_id', moduleIds)
      .order('created_at', { ascending: false });

    if (quizError) throw quizError;

    const quizzes = (quizRows ?? []) as QuizRow[];
    const quizIds = quizzes.map((quiz) => quiz.id);
    const [questionsResult, attemptsResult] = await Promise.all([
      quizIds.length
        ? supabase.from('quiz_questions').select('id, quiz_id').in('quiz_id', quizIds)
        : Promise.resolve({ data: [], error: null }),
      quizIds.length
        ? supabase
            .from('quiz_attempts')
            .select('id, quiz_id, student_id, score, passed, submitted_at, created_at')
            .in('quiz_id', quizIds)
            .order('submitted_at', { ascending: false })
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (questionsResult.error || attemptsResult.error) {
      throw questionsResult.error ?? attemptsResult.error;
    }

    const questions = (questionsResult.data ?? []) as QuestionRow[];
    const attempts = (attemptsResult.data ?? []) as AttemptRow[];
    const studentIds = [...new Set(attempts.map((attempt) => attempt.student_id))];
    const { data: studentRows, error: studentError } = studentIds.length
      ? await supabase.from('profiles').select('id, full_name, email').in('id', studentIds)
      : { data: [], error: null };

    if (studentError) throw studentError;

    const students = (studentRows ?? []) as StudentRow[];
    const moduleById = new Map(modules.map((moduleItem) => [moduleItem.id, moduleItem]));
    const studentById = new Map(students.map((student) => [student.id, student]));
    const questionCountByQuiz = countBy(questions, (question) => question.quiz_id);
    const attemptsByQuiz = groupBy(attempts, (attempt) => attempt.quiz_id);

    return {
      modules: modules.map((moduleItem) => ({ id: moduleItem.id, title: moduleItem.title })),
      quizzes: quizzes.map((quiz) => {
        const moduleItem = moduleById.get(quiz.module_id);
        const quizAttempts = attemptsByQuiz.get(quiz.id) ?? [];
        const scores = quizAttempts
          .map((attempt) => attempt.score)
          .filter((score): score is number => typeof score === 'number');

        return {
          id: quiz.id,
          title: quiz.title,
          description: quiz.description,
          moduleId: quiz.module_id,
          moduleTitle: moduleItem?.title ?? 'Modul tidak ditemukan',
          moduleStatus: moduleItem?.status ?? 'draft',
          questionCount: questionCountByQuiz.get(quiz.id) ?? 0,
          passingGrade: quiz.passing_score ?? 70,
          maxAttempts: Math.max(quiz.max_attempts ?? 1, 1),
          allowRetake: Math.max(quiz.max_attempts ?? 1, 1) > 1 && Boolean(quiz.allow_retake),
          attemptCount: quizAttempts.length,
          averageScore: scores.length ? Math.round(scores.reduce((total, score) => total + score, 0) / scores.length) : null,
          bestScore: scores.length ? Math.round(Math.max(...scores)) : null,
          status: quiz.status ?? (quiz.is_published ? 'published' : 'draft'),
          isPublished: Boolean(quiz.is_published) || quiz.status === 'published',
          attempts: quizAttempts.map((attempt) => {
            const student = studentById.get(attempt.student_id);

            return {
              id: attempt.id,
              studentId: attempt.student_id,
              studentName: student?.full_name ?? 'Siswa',
              studentEmail: student?.email ?? null,
              score: attempt.score,
              passed: Boolean(attempt.passed),
              submittedAt: attempt.submitted_at,
              createdAt: attempt.created_at,
            };
          }),
        };
      }),
      isDemo: false,
    };
  } catch {
    return { quizzes: [], modules: [], isDemo: false };
  }
}

function buildDemoTeacherQuizzes(): TeacherQuizzesData {
  const now = new Date().toISOString();

  return {
    modules: [
      { id: 'demo-module-1', title: 'Adab dalam Islam' },
      { id: 'demo-module-2', title: 'Tawazun dan Keseimbangan' },
    ],
    quizzes: [
      {
        id: 'demo-quiz-1',
        title: 'Kuis Adab',
        description: 'Evaluasi pemahaman adab sehari-hari.',
        moduleId: 'demo-module-1',
        moduleTitle: 'Adab dalam Islam',
        moduleStatus: 'published',
        questionCount: 5,
        passingGrade: 70,
        maxAttempts: 3,
        allowRetake: true,
        attemptCount: 8,
        averageScore: 84,
        bestScore: 100,
        status: 'published',
        isPublished: true,
        attempts: [
          {
            id: 'demo-attempt-1',
            studentId: 'demo-student-1',
            studentName: 'Aisyah Putri',
            studentEmail: 'aisyah@example.test',
            score: 90,
            passed: true,
            submittedAt: now,
            createdAt: now,
          },
        ],
      },
    ],
    isDemo: true,
  };
}

function groupBy<T>(items: T[], keyFn: (item: T) => string) {
  const groups = new Map<string, T[]>();

  for (const item of items) {
    const key = keyFn(item);
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }

  return groups;
}

function countBy<T>(items: T[], keyFn: (item: T) => string) {
  const counts = new Map<string, number>();

  for (const item of items) {
    const key = keyFn(item);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return counts;
}
