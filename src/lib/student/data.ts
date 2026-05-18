import { demoStudentActivities, demoStudentModules, type StudentModule } from '@/lib/demo/student';
import {
  mergeModulesWithStudentProgress,
  type LessonCountRow,
  type ModuleProgressRow,
  type PublishedModuleRow,
} from '@/lib/modules/status';
import { formatDateTime } from '@/lib/date';
import { getStudentClassTeacherContext } from '@/lib/scope';
import { getEffectiveStreak } from '@/lib/student/streak';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import type { Profile, StudentActivity } from '@/lib/types';

type StudentContext = {
  id?: string;
  classId?: string | null;
  xp?: number | null;
  streakCount?: number | null;
  lastActiveAt?: string | null;
};

type AnnouncementRow = {
  title: string;
  content: string;
  published_at: string | null;
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
  announcements: AnnouncementRow[];
  activities: StudentActivity[];
  isDemo: boolean;
};

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export async function getStudentModules(student?: Profile | string): Promise<StudentModule[]> {
  if (!isSupabaseConfigured) return demoStudentModules;

  const context = normalizeStudentContext(student);

  try {
    const supabase = await createClient();
    if (!context.id) return [];

    const scope = await getStudentClassTeacherContext(context.id);
    if (!scope.teacherId) return [];

    const { data, error } = await supabase
      .from('modules')
      .select('id, slug, title, description, cover_image_path, estimated_minutes, order_index')
      .eq('status', 'published')
      .eq('created_by', scope.teacherId)
      .order('order_index', { ascending: true });

    if (error) throw error;

    const moduleRows = (data ?? []) as PublishedModuleRow[];
    if (!moduleRows.length) return [];

    const moduleIds = moduleRows.map((moduleRow) => moduleRow.id);
    const [lessonsResult, progressResult] = await Promise.all([
      supabase.from('lessons').select('module_id').in('module_id', moduleIds),
      context.id
        ? supabase
            .from('module_progress')
            .select('module_id, status, progress_percent, completed_at, last_accessed_at')
            .eq('student_id', context.id)
            .in('module_id', moduleIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (lessonsResult.error) throw lessonsResult.error;
    if (progressResult.error) throw progressResult.error;

    return mergeModulesWithStudentProgress({
      modules: moduleRows,
      lessons: (lessonsResult.data ?? []) as LessonCountRow[],
      progressRows: (progressResult.data ?? []) as ModuleProgressRow[],
    });
  } catch {
    return [];
  }
}

export async function getStudentDashboardData(student?: Profile | string): Promise<StudentDashboardData> {
  if (!isSupabaseConfigured) {
    return {
      modules: demoStudentModules,
      quizAttemptsCount: 18,
      streakDays: 7,
      points: 2450,
      announcements: [
        {
          title: 'Kuis Akhir Pekan',
          content: 'Ikuti kuis akhir pekan dan dapatkan poin tambahan.',
          published_at: null,
        },
        {
          title: 'Modul Baru Tersedia',
          content: 'Modul Islam dan Lingkungan sudah tersedia untuk dipelajari.',
          published_at: null,
        },
      ],
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
    const modules = await getStudentModules(student);
    const [profileStats, quizAttemptsCount, announcements, activities] = await Promise.all([
      getProfileStats(supabase, context),
      getQuizAttemptsCount(supabase, context.id),
      getStudentAnnouncements(supabase, context.classId),
      getRecentActivities(supabase, context.id, modules),
    ]);

    return {
      modules,
      quizAttemptsCount,
      streakDays: profileStats.streakCount,
      points: profileStats.xp,
      announcements,
      activities,
      isDemo: false,
    };
  } catch {
    return {
      modules: [],
      quizAttemptsCount: 0,
      streakDays: 0,
      points: 0,
      announcements: [],
      activities: [],
      isDemo: false,
    };
  }
}

export async function getStudentModule(moduleId: string, studentId?: string) {
  const modules = await getStudentModules(studentId);
  return modules.find((moduleItem) => moduleItem.id === moduleId || moduleItem.slug === moduleId) ?? modules[0];
}

function normalizeStudentContext(student?: Profile | string): StudentContext {
  if (!student) return {};
  if (typeof student === 'string') return { id: student };

  return {
    id: student.id,
    classId: student.class_id,
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

async function getQuizAttemptsCount(supabase: SupabaseServerClient, studentId?: string) {
  if (!studentId) return 0;

  const modules = await getStudentModules(studentId);
  const moduleIds = modules.map((moduleItem) => moduleItem.id);
  if (!moduleIds.length) return 0;

  const { data: quizzes } = await supabase.from('quizzes').select('id').in('module_id', moduleIds);
  const quizIds = (quizzes ?? []).map((quiz) => quiz.id as string);
  if (!quizIds.length) return 0;

  const { count, error } = await supabase
    .from('quiz_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('student_id', studentId)
    .in('quiz_id', quizIds);

  return error ? 0 : count ?? 0;
}

async function getStudentAnnouncements(
  supabase: SupabaseServerClient,
  classId?: string | null,
): Promise<AnnouncementRow[]> {
  let query = supabase
    .from('announcements')
    .select('title, content, published_at')
    .eq('status', 'published')
    .not('published_at', 'is', null)
    .lte('published_at', new Date().toISOString())
    .order('published_at', { ascending: false })
    .limit(3);

  query = classId ? query.or(`class_id.is.null,class_id.eq.${classId}`) : query.is('class_id', null);

  const { data, error } = await query;

  return error ? [] : ((data ?? []) as AnnouncementRow[]);
}

async function getRecentActivities(
  supabase: SupabaseServerClient,
  studentId: string | undefined,
  modules: StudentModule[],
): Promise<StudentActivity[]> {
  if (!studentId) return [];

  const moduleTitleById = new Map(modules.map((moduleItem) => [moduleItem.id, moduleItem.title]));
  const moduleIds = modules.map((moduleItem) => moduleItem.id);
  if (!moduleIds.length) return [];

  const { data: quizRows } = await supabase.from('quizzes').select('id, title, module_id').in('module_id', moduleIds);
  const scopedQuizIds = ((quizRows ?? []) as QuizTitleRow[]).map((quiz) => quiz.id);

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
  const quizTitleById = new Map(((quizRows ?? []) as QuizTitleRow[]).map((quiz) => [quiz.id, quiz]));
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
    const isCompleted = progress.status === 'completed' || progress.completed_at || progress.progress_percent === 100;
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
