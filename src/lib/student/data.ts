import { demoStudentActivities, demoStudentModules, type StudentModule } from '@/lib/demo/student';
import {
  mergeModulesWithStudentProgress,
  type ModuleProgressRow,
  type PublishedModuleRow,
} from '@/lib/modules/status';
import { formatDateTime } from '@/lib/date';
import { getEffectiveStreak } from '@/lib/student/streak';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import type { Profile, StudentActivity } from '@/lib/types';

type StudentContext = {
  id?: string;
  xp?: number | null;
  streakCount?: number | null;
  lastActiveAt?: string | null;
};

type ProfileStatsRow = {
  xp: number | null;
  streak_count: number | null;
  last_active_at: string | null;
};

type QuizAttemptActivityRow = {
  id: string;
  quiz_id: string;
  score: number | null;
  submitted_at: string | null;
  created_at: string;
};

type ReflectionActivityRow = {
  id: string;
  module_id: string;
  created_at: string;
};

type ModuleProgressActivityRow = {
  id: string;
  module_id: string;
  status: string | null;
  progress_percent: number | null;
  completed_at: string | null;
  updated_at: string;
  created_at: string;
};

type QuizTitleRow = {
  id: string;
  title: string;
  module_id: string;
};

export type StudentDashboardData = {
  modules: StudentModule[];
  quizAttemptsCount: number;
  streakDays: number;
  points: number;
  activities: StudentActivity[];
  isDemo: boolean;
};

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export async function getStudentModules(student?: Profile | string): Promise<StudentModule[]> {
  if (!isSupabaseConfigured) return demoStudentModules;

  const context = normalizeStudentContext(student);

  try {
    const supabase = await createClient();
    return (await loadStudentModuleData(supabase, context, false)).modules;
  } catch (error) {
    throw new Error('Data gagal dimuat. Silakan coba lagi.', { cause: error });
  }
}

export async function getStudentDashboardData(student?: Profile | string): Promise<StudentDashboardData> {
  if (!isSupabaseConfigured) {
    return {
      modules: demoStudentModules,
      quizAttemptsCount: 18,
      streakDays: 7,
      points: 2450,
      activities: demoStudentActivities.map((activity, index) => ({
        ...activity,
        time: formatDateTime(new Date(Date.now() - index * 60 * 60 * 1000)),
      })),
      isDemo: true,
    };
  }

  const context = normalizeStudentContext(student);

  try {
    const supabase = await createClient();
    const [moduleData, profileStats] = await Promise.all([
      loadStudentModuleData(supabase, context, true),
      getProfileStats(supabase, context),
    ]);
    const [quizAttemptsCount, activities] = await Promise.all([
      getQuizAttemptsCount(supabase, context.id, moduleData.quizRows),
      getRecentActivities(supabase, context.id, moduleData.modules, moduleData.quizRows),
    ]);

    return {
      modules: moduleData.modules,
      quizAttemptsCount,
      streakDays: profileStats.streakCount,
      points: profileStats.xp,
      activities,
      isDemo: false,
    };
  } catch (error) {
    throw new Error('Data gagal dimuat. Silakan coba lagi.', { cause: error });
  }
}

async function loadStudentModuleData(
  supabase: SupabaseServerClient,
  context: StudentContext,
  includeQuizRows: boolean,
): Promise<{ modules: StudentModule[]; quizRows: QuizTitleRow[] }> {
  if (!context.id) return { modules: [], quizRows: [] };

  const { data, error } = await supabase.rpc('get_student_module_catalog', { include_quizzes: includeQuizRows });
  if (error) throw error;
  const catalog = data as {
    modules: (PublishedModuleRow & Omit<ModuleProgressRow, 'module_id' | 'status'> & { progress_status: ModuleProgressRow['status'] })[];
    quizzes: QuizTitleRow[];
  };
  return {
    modules: mergeModulesWithStudentProgress({
      modules: catalog.modules,
      lessons: [],
      progressRows: catalog.modules.filter((item) => item.progress_status).map((item) => ({
        module_id: item.id,
        status: item.progress_status,
        progress_percent: item.progress_percent,
        completed_at: item.completed_at,
        last_accessed_at: item.last_accessed_at,
      })),
    }),
    quizRows: catalog.quizzes,
  };
}

export async function getStudentModule(moduleId: string, studentId?: string) {
  const modules = await getStudentModules(studentId);
  return modules.find((moduleItem) => moduleItem.id === moduleId || moduleItem.slug === moduleId) ?? null;
}

function normalizeStudentContext(student?: Profile | string): StudentContext {
  if (!student) return {};
  if (typeof student === 'string') return { id: student };

  return {
    id: student.id,
    xp: student.xp,
    streakCount: student.streak_count,
    lastActiveAt: student.last_active_at,
  };
}

async function getProfileStats(
  supabase: SupabaseServerClient,
  context: StudentContext,
): Promise<{ xp: number; streakCount: number }> {
  if (typeof context.xp === 'number' || typeof context.streakCount === 'number') {
    return {
      xp: Math.max(Math.round(context.xp ?? 0), 0),
      streakCount: getEffectiveStreak(context.streakCount, context.lastActiveAt),
    };
  }

  if (!context.id) return { xp: 0, streakCount: 0 };

  const { data, error } = await supabase
    .from('profiles')
    .select('xp, streak_count, last_active_at')
    .eq('id', context.id)
    .maybeSingle<ProfileStatsRow>();

  if (error || !data) return { xp: 0, streakCount: 0 };

  return {
    xp: Math.max(Math.round(data.xp ?? 0), 0),
    streakCount: getEffectiveStreak(data.streak_count, data.last_active_at),
  };
}

async function getQuizAttemptsCount(
  supabase: SupabaseServerClient,
  studentId: string | undefined,
  quizRows: QuizTitleRow[],
) {
  if (!studentId) return 0;

  const quizIds = quizRows.map((quiz) => quiz.id);
  if (!quizIds.length) return 0;

  const { count, error } = await supabase
    .from('quiz_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('student_id', studentId)
    .in('quiz_id', quizIds);

  return error ? 0 : count ?? 0;
}

async function getRecentActivities(
  supabase: SupabaseServerClient,
  studentId: string | undefined,
  modules: StudentModule[],
  quizRows: QuizTitleRow[],
): Promise<StudentActivity[]> {
  if (!studentId) return [];

  const moduleTitleById = new Map(modules.map((moduleItem) => [moduleItem.id, moduleItem.title]));
  const moduleIds = modules.map((moduleItem) => moduleItem.id);
  if (!moduleIds.length) return [];

  const scopedQuizIds = quizRows.map((quiz) => quiz.id);

  const [attemptsResult, reflectionsResult, progressResult] = await Promise.all([
    scopedQuizIds.length
      ? supabase
          .from('quiz_attempts')
          .select('id, quiz_id, score, submitted_at, created_at')
          .eq('student_id', studentId)
          .in('quiz_id', scopedQuizIds)
          .order('submitted_at', { ascending: false, nullsFirst: false })
          .order('created_at', { ascending: false })
          .limit(3)
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from('reflections')
      .select('id, module_id, created_at')
      .eq('student_id', studentId)
      .in('module_id', moduleIds)
      .order('created_at', { ascending: false })
      .limit(3),
    supabase
      .from('module_progress')
      .select('id, module_id, status, progress_percent, completed_at, updated_at, created_at')
      .eq('student_id', studentId)
      .in('module_id', moduleIds)
      .order('updated_at', { ascending: false })
      .limit(3),
  ]);

  const attempts = attemptsResult.error ? [] : ((attemptsResult.data ?? []) as QuizAttemptActivityRow[]);
  const reflections = reflectionsResult.error ? [] : ((reflectionsResult.data ?? []) as ReflectionActivityRow[]);
  const progressRows = progressResult.error ? [] : ((progressResult.data ?? []) as ModuleProgressActivityRow[]);
  const quizTitleById = new Map(quizRows.map((quiz) => [quiz.id, quiz]));
  const activityItems: Array<StudentActivity & { sortAt: string }> = [];

  for (const attempt of attempts) {
    const quiz = quizTitleById.get(attempt.quiz_id);
    activityItems.push({
      title: quiz ? `Mengerjakan kuis "${quiz.title}"` : 'Mengerjakan kuis',
      time: formatDateTime(attempt.submitted_at ?? attempt.created_at),
      type: 'quiz',
      sortAt: attempt.submitted_at ?? attempt.created_at,
    });
  }

  for (const reflection of reflections) {
    const moduleTitle = moduleTitleById.get(reflection.module_id);
    activityItems.push({
      title: moduleTitle ? `Mengumpulkan refleksi "${moduleTitle}"` : 'Mengumpulkan refleksi',
      time: formatDateTime(reflection.created_at),
      type: 'reflection',
      sortAt: reflection.created_at,
    });
  }

  for (const progress of progressRows) {
    const moduleTitle = moduleTitleById.get(progress.module_id);
    const isCompleted = progress.status === 'completed' || progress.completed_at;
    activityItems.push({
      title: `${isCompleted ? 'Menyelesaikan' : 'Melanjutkan'} modul${moduleTitle ? ` "${moduleTitle}"` : ''}`,
      time: formatDateTime(progress.completed_at ?? progress.updated_at ?? progress.created_at),
      type: 'module',
      sortAt: progress.completed_at ?? progress.updated_at ?? progress.created_at,
    });
  }

  return activityItems
    .sort((first, second) => new Date(second.sortAt).getTime() - new Date(first.sortAt).getTime())
    .slice(0, 5)
    .map((activity) => ({
      title: activity.title,
      time: activity.time,
      type: activity.type,
    }));
}
