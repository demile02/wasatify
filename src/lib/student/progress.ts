import { demoStudentActivities, demoStudentModules } from '@/lib/demo/student';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import type { ModuleStatus } from '@/lib/types';

export type ProgressModule = {
  id: string;
  title: string;
  slug: string;
  progress: number;
  status: ModuleStatus;
  estimatedMinutes: number;
  completedAt: string | null;
  lastAccessedAt: string | null;
};

export type ProgressBadge = {
  id: string;
  title: string;
  description: string;
  icon: string | null;
  xpReward: number;
  earnedAt: string;
};

export type ProgressActivity = {
  id: string;
  title: string;
  description: string;
  date: string;
  type: 'quiz' | 'reflection' | 'module';
};

export type StudentProgressData = {
  overallProgress: number;
  xp: number;
  streakDays: number;
  studyMinutes: number;
  completedModules: ProgressModule[];
  modules: ProgressModule[];
  badges: ProgressBadge[];
  activities: ProgressActivity[];
  isDemo: boolean;
};

type ModuleRow = {
  id: string;
  slug: string;
  title: string;
  estimated_minutes: number | null;
};

type ModuleProgressRow = {
  module_id: string;
  status: ModuleStatus | null;
  progress_percent: number | null;
  completed_at: string | null;
  last_accessed_at: string | null;
  updated_at: string | null;
  created_at: string | null;
};

type QuizAttemptRow = {
  id: string;
  quiz_id: string;
  score: number | null;
  submitted_at: string | null;
  created_at: string | null;
};

type QuizRow = {
  id: string;
  title: string;
  module_id: string;
};

type ReflectionRow = {
  id: string;
  module_id: string;
  created_at: string;
};

type StudentAchievementRow = {
  achievement_id: string;
  earned_at: string;
};

type AchievementRow = {
  id: string;
  title: string;
  description: string;
  icon: string | null;
  xp_reward: number | null;
};

export async function getStudentProgressData(studentId: string): Promise<StudentProgressData> {
  if (!isSupabaseConfigured) {
    return buildDemoProgressData();
  }

  try {
    const supabase = await createClient();
    const { data: moduleRows, error: moduleError } = await supabase
      .from('modules')
      .select('id, slug, title, estimated_minutes')
      .eq('status', 'published')
      .order('order_index', { ascending: true });

    if (moduleError) throw moduleError;

    const modules = (moduleRows ?? []) as ModuleRow[];
    const moduleTitleById = new Map(modules.map((moduleItem) => [moduleItem.id, moduleItem.title]));

    const [progressResult, quizAttemptResult, reflectionResult, studentAchievementResult] = await Promise.all([
      supabase
        .from('module_progress')
        .select('module_id, status, progress_percent, completed_at, last_accessed_at, updated_at, created_at')
        .eq('student_id', studentId),
      supabase
        .from('quiz_attempts')
        .select('id, quiz_id, score, submitted_at, created_at')
        .eq('student_id', studentId)
        .order('submitted_at', { ascending: false }),
      supabase
        .from('reflections')
        .select('id, module_id, created_at')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false }),
      supabase
        .from('student_achievements')
        .select('achievement_id, earned_at')
        .eq('student_id', studentId)
        .order('earned_at', { ascending: false }),
    ]);

    if (progressResult.error || quizAttemptResult.error || reflectionResult.error || studentAchievementResult.error) {
      throw progressResult.error ?? quizAttemptResult.error ?? reflectionResult.error ?? studentAchievementResult.error;
    }

    const progressRows = (progressResult.data ?? []) as ModuleProgressRow[];
    const quizAttempts = (quizAttemptResult.data ?? []) as QuizAttemptRow[];
    const reflections = (reflectionResult.data ?? []) as ReflectionRow[];
    const studentAchievements = (studentAchievementResult.data ?? []) as StudentAchievementRow[];
    const progressByModule = new Map(progressRows.map((progress) => [progress.module_id, progress]));

    const progressModules = modules.map((moduleItem) => {
      const progress = progressByModule.get(moduleItem.id);
      const progressPercent = clampProgress(progress?.progress_percent ?? 0);

      return {
        id: moduleItem.id,
        slug: moduleItem.slug,
        title: moduleItem.title,
        estimatedMinutes: moduleItem.estimated_minutes ?? 15,
        progress: progressPercent,
        status: resolveProgressStatus(progress, progressPercent),
        completedAt: progress?.completed_at ?? null,
        lastAccessedAt: progress?.last_accessed_at ?? null,
      };
    });

    const quizIds = [...new Set(quizAttempts.map((attempt) => attempt.quiz_id))];
    const quizTitleById = await getQuizTitleMap(quizIds);
    const achievementIds = studentAchievements.map((achievement) => achievement.achievement_id);
    const achievementById = await getAchievementMap(achievementIds);
    const badges = studentAchievements
      .map((studentAchievement) => {
        const achievement = achievementById.get(studentAchievement.achievement_id);
        if (!achievement) return null;

        return {
          id: achievement.id,
          title: achievement.title,
          description: achievement.description,
          icon: achievement.icon,
          xpReward: achievement.xp_reward ?? 0,
          earnedAt: studentAchievement.earned_at,
        };
      })
      .filter((badge): badge is ProgressBadge => Boolean(badge));

    const completedModules = progressModules.filter((moduleItem) => moduleItem.status === 'completed');
    const overallProgress = progressModules.length
      ? Math.round(progressModules.reduce((total, moduleItem) => total + moduleItem.progress, 0) / progressModules.length)
      : 0;
    const studyMinutes = progressModules.reduce(
      (total, moduleItem) => total + Math.round((moduleItem.estimatedMinutes * moduleItem.progress) / 100),
      0,
    );
    const activities = buildActivities({
      moduleTitleById,
      progressRows,
      quizAttempts,
      quizTitleById,
      reflections,
    });
    const earnedXp = badges.reduce((total, badge) => total + badge.xpReward, 0);

    return {
      overallProgress,
      xp: completedModules.length * 150 + quizAttempts.length * 50 + reflections.length * 25 + earnedXp,
      streakDays: calculateStreakDays(activities.map((activity) => activity.date)),
      studyMinutes,
      completedModules,
      modules: progressModules,
      badges,
      activities,
      isDemo: false,
    };
  } catch {
    return {
      overallProgress: 0,
      xp: 0,
      streakDays: 0,
      studyMinutes: 0,
      completedModules: [],
      modules: [],
      badges: [],
      activities: [],
      isDemo: false,
    };
  }
}

async function getQuizTitleMap(quizIds: string[]) {
  if (!quizIds.length) return new Map<string, string>();

  const supabase = await createClient();
  const { data } = await supabase.from('quizzes').select('id, title, module_id').in('id', quizIds);

  return new Map(((data ?? []) as QuizRow[]).map((quiz) => [quiz.id, quiz.title]));
}

async function getAchievementMap(achievementIds: string[]) {
  if (!achievementIds.length) return new Map<string, AchievementRow>();

  const supabase = await createClient();
  const { data } = await supabase
    .from('achievements')
    .select('id, title, description, icon, xp_reward')
    .in('id', achievementIds);

  return new Map(((data ?? []) as AchievementRow[]).map((achievement) => [achievement.id, achievement]));
}

function buildActivities({
  moduleTitleById,
  progressRows,
  quizAttempts,
  quizTitleById,
  reflections,
}: {
  moduleTitleById: Map<string, string>;
  progressRows: ModuleProgressRow[];
  quizAttempts: QuizAttemptRow[];
  quizTitleById: Map<string, string>;
  reflections: ReflectionRow[];
}) {
  const activities: ProgressActivity[] = [
    ...quizAttempts.map((attempt) => ({
      id: `quiz-${attempt.id}`,
      title: `Menyelesaikan kuis "${quizTitleById.get(attempt.quiz_id) ?? 'Kuis Modul'}"`,
      description: attempt.score === null ? 'Hasil kuis tersimpan' : `Skor ${Math.round(Number(attempt.score))}`,
      date: attempt.submitted_at ?? attempt.created_at ?? new Date().toISOString(),
      type: 'quiz' as const,
    })),
    ...reflections.map((reflection) => ({
      id: `reflection-${reflection.id}`,
      title: `Mengumpulkan refleksi "${moduleTitleById.get(reflection.module_id) ?? 'Modul'}"`,
      description: 'Refleksi dan aksi nyata tersimpan',
      date: reflection.created_at,
      type: 'reflection' as const,
    })),
    ...progressRows
      .filter((progress) => progress.status === 'completed' || progress.completed_at || progress.progress_percent === 100)
      .map((progress) => ({
        id: `module-${progress.module_id}`,
        title: `Menyelesaikan modul "${moduleTitleById.get(progress.module_id) ?? 'Modul'}"`,
        description: 'Progress modul selesai',
        date: progress.completed_at ?? progress.updated_at ?? progress.created_at ?? new Date().toISOString(),
        type: 'module' as const,
      })),
  ];

  return activities
    .sort((first, second) => new Date(second.date).getTime() - new Date(first.date).getTime())
    .slice(0, 8);
}

function resolveProgressStatus(progress: ModuleProgressRow | undefined, progressPercent: number): ModuleStatus {
  if (!progress) return 'not_started';
  if (progress.status === 'completed' || progress.completed_at || progressPercent >= 100) return 'completed';
  if (progress.status === 'in_progress' || progressPercent > 0) return 'in_progress';
  return 'not_started';
}

function calculateStreakDays(activityDates: string[]) {
  if (!activityDates.length) return 0;

  const activeDays = new Set(
    activityDates
      .map((date) => new Date(date))
      .filter((date) => !Number.isNaN(date.getTime()))
      .map((date) => date.toISOString().slice(0, 10)),
  );

  const cursor = new Date();
  let streak = 0;

  for (let index = 0; index < 365; index += 1) {
    const key = cursor.toISOString().slice(0, 10);

    if (!activeDays.has(key)) {
      if (streak === 0) {
        cursor.setDate(cursor.getDate() - 1);
        continue;
      }
      break;
    }

    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function buildDemoProgressData(): StudentProgressData {
  const modules = demoStudentModules.map((moduleItem) => ({
    id: moduleItem.id,
    slug: moduleItem.slug,
    title: moduleItem.title,
    progress: moduleItem.progress,
    status: moduleItem.status,
    estimatedMinutes: Number.parseInt(moduleItem.duration, 10) || 30,
    completedAt: moduleItem.completedAt ?? null,
    lastAccessedAt: moduleItem.lastAccessedAt ?? null,
  }));
  const completedModules = modules.filter((moduleItem) => moduleItem.status === 'completed');

  return {
    overallProgress: modules.length
      ? Math.round(modules.reduce((total, moduleItem) => total + moduleItem.progress, 0) / modules.length)
      : 0,
    xp: 2450,
    streakDays: 7,
    studyMinutes: 165,
    completedModules,
    modules,
    badges: [
      {
        id: 'demo-badge-1',
        title: 'Langkah Pertama',
        description: 'Menyelesaikan modul pertama di WASATIFY.',
        icon: 'book-open-check',
        xpReward: 100,
        earnedAt: new Date().toISOString(),
      },
    ],
    activities: demoStudentActivities.map((activity, index) => ({
      id: `demo-activity-${index}`,
      title: activity.title,
      description: activity.time,
      date: new Date(Date.now() - index * 60 * 60 * 1000).toISOString(),
      type: activity.type,
    })),
    isDemo: true,
  };
}

function clampProgress(value: number) {
  return Math.min(Math.max(Math.round(value), 0), 100);
}
