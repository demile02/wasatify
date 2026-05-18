import { demoStudentActivities, demoStudentModules } from '@/lib/demo/student';
import { getStudentClassTeacherContext } from '@/lib/scope';
import { getEffectiveStreak, getJakartaDateKey } from '@/lib/student/streak';
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
  code: string;
  title: string;
  description: string;
  icon: string | null;
  xpReward: number;
  earnedAt: string | null;
  unlocked: boolean;
};

export type ProgressActivity = {
  id: string;
  title: string;
  description: string;
  date: string;
  type: 'quiz' | 'reflection' | 'module';
};

export type QuizHistoryItem = {
  id: string;
  quizTitle: string;
  moduleTitle: string;
  score: number;
  passed: boolean;
  submittedAt: string;
};

export type StudentProgressData = {
  overallProgress: number;
  xp: number;
  streakDays: number;
  studyMinutes: number;
  totalModules: number;
  totalCompletedModules: number;
  totalQuizAttempts: number;
  totalReflections: number;
  reflectionModuleCount: number;
  completedModules: ProgressModule[];
  modules: ProgressModule[];
  badges: ProgressBadge[];
  activities: ProgressActivity[];
  quizHistory: QuizHistoryItem[];
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
  passed: boolean | null;
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
  code: string;
  title: string;
  description: string;
  icon: string | null;
  xp_reward: number | null;
};

type ProfileProgressRow = {
  xp: number | null;
  streak_count: number | null;
  last_active_at: string | null;
};

const achievementRules: Record<string, (input: AchievementRuleInput) => boolean> = {
  consistent_learner: ({ streakDays }) => streakDays >= 7,
  deep_understanding: ({ quizAttempts }) => quizAttempts.some((attempt) => Number(attempt.score ?? 0) >= 80),
  real_action: ({ reflections }) => reflections.length >= 1,
  explorer: ({ progressRows }) =>
    progressRows.filter((progress) => progress.status === 'in_progress' || progress.status === 'completed').length >= 3,
};

type AchievementRuleInput = {
  streakDays: number;
  quizAttempts: QuizAttemptRow[];
  reflections: ReflectionRow[];
  progressRows: ModuleProgressRow[];
};

export async function getStudentProgressData(studentId: string): Promise<StudentProgressData> {
  if (!isSupabaseConfigured) {
    return buildDemoProgressData();
  }

  try {
    const supabase = await createClient();
    const scope = await getStudentClassTeacherContext(studentId);
    if (!scope.teacherId) {
      return emptyStudentProgressData();
    }

    const { data: moduleRows, error: moduleError } = await supabase
      .from('modules')
      .select('id, slug, title, estimated_minutes')
      .eq('status', 'published')
      .eq('created_by', scope.teacherId)
      .order('order_index', { ascending: true });

    if (moduleError) throw moduleError;

    const modules = (moduleRows ?? []) as ModuleRow[];
    const moduleTitleById = new Map(modules.map((moduleItem) => [moduleItem.id, moduleItem.title]));
    const moduleIds = modules.map((moduleItem) => moduleItem.id);
    const { data: scopedQuizRows } = moduleIds.length
      ? await supabase.from('quizzes').select('id, title, module_id').in('module_id', moduleIds)
      : { data: [] };
    const scopedQuizzes = (scopedQuizRows ?? []) as QuizRow[];
    const scopedQuizIds = scopedQuizzes.map((quiz) => quiz.id);

    const [profileResult, progressResult, quizAttemptResult, reflectionResult, achievementResult, studentAchievementResult] =
      await Promise.all([
        supabase.from('profiles').select('xp, streak_count, last_active_at').eq('id', studentId).maybeSingle<ProfileProgressRow>(),
        moduleIds.length
          ? supabase
              .from('module_progress')
              .select('module_id, status, progress_percent, completed_at, last_accessed_at, updated_at, created_at')
              .eq('student_id', studentId)
              .in('module_id', moduleIds)
          : Promise.resolve({ data: [], error: null }),
        scopedQuizIds.length
          ? supabase
              .from('quiz_attempts')
              .select('id, quiz_id, score, passed, submitted_at, created_at')
              .eq('student_id', studentId)
              .in('quiz_id', scopedQuizIds)
              .order('submitted_at', { ascending: false })
          : Promise.resolve({ data: [], error: null }),
        moduleIds.length
          ? supabase
              .from('reflections')
              .select('id, module_id, created_at')
              .eq('student_id', studentId)
              .in('module_id', moduleIds)
              .order('created_at', { ascending: false })
          : Promise.resolve({ data: [], error: null }),
        supabase.from('achievements').select('id, code, title, description, icon, xp_reward'),
        supabase
          .from('student_achievements')
          .select('achievement_id, earned_at')
          .eq('student_id', studentId)
          .order('earned_at', { ascending: false }),
      ]);

    if (
      profileResult.error ||
      progressResult.error ||
      quizAttemptResult.error ||
      reflectionResult.error ||
      achievementResult.error ||
      studentAchievementResult.error
    ) {
      throw (
        profileResult.error ??
        progressResult.error ??
        quizAttemptResult.error ??
        reflectionResult.error ??
        achievementResult.error ??
        studentAchievementResult.error
      );
    }

    const profile = profileResult.data;
    const progressRows = (progressResult.data ?? []) as ModuleProgressRow[];
    const quizAttempts = (quizAttemptResult.data ?? []) as QuizAttemptRow[];
    const reflections = (reflectionResult.data ?? []) as ReflectionRow[];
    const achievements = (achievementResult.data ?? []) as AchievementRow[];
    let studentAchievements = (studentAchievementResult.data ?? []) as StudentAchievementRow[];

    const profileStreak = getEffectiveStreak(profile?.streak_count, profile?.last_active_at);
    const activityDates = [
      ...quizAttempts.map((attempt) => attempt.submitted_at ?? attempt.created_at ?? ''),
      ...reflections.map((reflection) => reflection.created_at),
      ...progressRows.map((progress) => progress.completed_at ?? progress.updated_at ?? progress.created_at ?? ''),
    ].filter(Boolean);
    const streakDays = Math.max(profileStreak, calculateStreakDays(activityDates));

    const unlockResult = await unlockEligibleAchievements({
      studentId,
      achievements,
      studentAchievements,
      input: { streakDays, quizAttempts, reflections, progressRows },
    });
    studentAchievements = unlockResult.studentAchievements;

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

    const quizById = new Map(scopedQuizzes.map((quiz) => [quiz.id, quiz]));
    const badges = buildBadges(achievements, studentAchievements);
    const completedModules = progressModules.filter((moduleItem) => moduleItem.status === 'completed');
    const overallProgress = progressModules.length
      ? Math.round((completedModules.length / progressModules.length) * 100)
      : 0;
    const studyMinutes = progressModules.reduce(
      (total, moduleItem) => total + Math.round((moduleItem.estimatedMinutes * moduleItem.progress) / 100),
      0,
    );
    const activities = buildActivities({
      moduleTitleById,
      progressRows,
      quizAttempts,
      quizById,
      reflections,
    });
    const quizHistory = quizAttempts.slice(0, 8).map((attempt) => {
      const quiz = quizById.get(attempt.quiz_id);
      return {
        id: attempt.id,
        quizTitle: quiz?.title ?? 'Kuis Modul',
        moduleTitle: quiz ? moduleTitleById.get(quiz.module_id) ?? 'Modul' : 'Modul',
        score: Math.round(Number(attempt.score ?? 0)),
        passed: Boolean(attempt.passed),
        submittedAt: attempt.submitted_at ?? attempt.created_at ?? new Date().toISOString(),
      };
    });

    return {
      overallProgress,
      xp: (profile?.xp ?? 0) + unlockResult.addedXp,
      streakDays,
      studyMinutes,
      totalModules: progressModules.length,
      totalCompletedModules: completedModules.length,
      totalQuizAttempts: quizAttempts.length,
      totalReflections: reflections.length,
      reflectionModuleCount: new Set(reflections.map((reflection) => reflection.module_id)).size,
      completedModules,
      modules: progressModules,
      badges,
      activities,
      quizHistory,
      isDemo: false,
    };
  } catch {
    return emptyStudentProgressData();
  }
}

async function unlockEligibleAchievements({
  studentId,
  achievements,
  studentAchievements,
  input,
}: {
  studentId: string;
  achievements: AchievementRow[];
  studentAchievements: StudentAchievementRow[];
  input: AchievementRuleInput;
}) {
  const supabase = await createClient();
  const earnedIds = new Set(studentAchievements.map((achievement) => achievement.achievement_id));
  const newlyEarned = achievements.filter((achievement) => {
    if (earnedIds.has(achievement.id)) return false;
    const rule = achievementRules[achievement.code];
    return rule ? rule(input) : false;
  });

  if (!newlyEarned.length) {
    return { studentAchievements, addedXp: 0 };
  }

  const now = new Date().toISOString();
  const { data } = await supabase
    .from('student_achievements')
    .insert(newlyEarned.map((achievement) => ({ student_id: studentId, achievement_id: achievement.id, earned_at: now })))
    .select('achievement_id, earned_at');

  const addedXp = newlyEarned.reduce((total, achievement) => total + (achievement.xp_reward ?? 0), 0);
  if (addedXp > 0) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('xp')
      .eq('id', studentId)
      .maybeSingle<{ xp: number | null }>();

    await supabase
      .from('profiles')
      .update({ xp: (profile?.xp ?? 0) + addedXp })
      .eq('id', studentId);
  }

  return {
    studentAchievements: [...studentAchievements, ...((data ?? []) as StudentAchievementRow[])],
    addedXp,
  };
}

function emptyStudentProgressData(): StudentProgressData {
  return {
    overallProgress: 0,
    xp: 0,
    streakDays: 0,
    studyMinutes: 0,
    totalModules: 0,
    totalCompletedModules: 0,
    totalQuizAttempts: 0,
    totalReflections: 0,
    reflectionModuleCount: 0,
    completedModules: [],
    modules: [],
    badges: [],
    activities: [],
    quizHistory: [],
    isDemo: false,
  };
}

function buildBadges(achievements: AchievementRow[], studentAchievements: StudentAchievementRow[]) {
  const earnedByAchievement = new Map(
    studentAchievements.map((studentAchievement) => [studentAchievement.achievement_id, studentAchievement.earned_at]),
  );

  return achievements.map((achievement) => {
    const earnedAt = earnedByAchievement.get(achievement.id) ?? null;
    return {
      id: achievement.id,
      code: achievement.code,
      title: achievement.title,
      description: achievement.description,
      icon: achievement.icon,
      xpReward: achievement.xp_reward ?? 0,
      earnedAt,
      unlocked: Boolean(earnedAt),
    };
  });
}

function buildActivities({
  moduleTitleById,
  progressRows,
  quizAttempts,
  quizById,
  reflections,
}: {
  moduleTitleById: Map<string, string>;
  progressRows: ModuleProgressRow[];
  quizAttempts: QuizAttemptRow[];
  quizById: Map<string, QuizRow>;
  reflections: ReflectionRow[];
}) {
  const activities: ProgressActivity[] = [
    ...quizAttempts.map((attempt) => {
      const quiz = quizById.get(attempt.quiz_id);
      const moduleTitle = quiz ? moduleTitleById.get(quiz.module_id) : null;
      return {
        id: `quiz-${attempt.id}`,
        title: `Menyelesaikan kuis ${moduleTitle ? `"${moduleTitle}"` : '"Modul"'}`,
        description: attempt.score === null ? 'Hasil kuis tersimpan' : `Skor ${Math.round(Number(attempt.score))}`,
        date: attempt.submitted_at ?? attempt.created_at ?? new Date().toISOString(),
        type: 'quiz' as const,
      };
    }),
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
      .map((date) => getJakartaDateKey(date)),
  );

  const cursor = new Date();
  let streak = 0;

  for (let index = 0; index < 365; index += 1) {
    const key = getJakartaDateKey(cursor);

    if (!activeDays.has(key)) {
      if (streak === 0 && index === 0) {
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
    overallProgress: modules.length ? Math.round((completedModules.length / modules.length) * 100) : 0,
    xp: 2450,
    streakDays: 7,
    studyMinutes: 165,
    totalModules: modules.length,
    totalCompletedModules: completedModules.length,
    totalQuizAttempts: 18,
    totalReflections: 3,
    reflectionModuleCount: 3,
    completedModules,
    modules,
    badges: [
      {
        id: 'demo-badge-1',
        code: 'consistent_learner',
        title: 'Pembelajar Konsisten',
        description: 'Belajar aktif selama 7 hari.',
        icon: 'book-open-check',
        xpReward: 100,
        earnedAt: new Date().toISOString(),
        unlocked: true,
      },
    ],
    activities: demoStudentActivities.map((activity, index) => ({
      id: `demo-activity-${index}`,
      title: activity.title,
      description: activity.time,
      date: new Date(Date.now() - index * 60 * 60 * 1000).toISOString(),
      type: activity.type,
    })),
    quizHistory: [],
    isDemo: true,
  };
}

function clampProgress(value: number) {
  return Math.min(Math.max(Math.round(value), 0), 100);
}
