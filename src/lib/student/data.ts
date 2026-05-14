import { demoStudentActivities, demoStudentModules, type StudentActivity, type StudentModule } from '@/lib/demo/student';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import type { ModuleStatus } from '@/lib/types';

type ModuleRow = {
  id: string;
  slug: string;
  title: string;
  description: string;
  estimated_minutes: number | null;
  order_index: number | null;
};

type LessonRow = {
  id: string;
  module_id: string;
};

type ProgressRow = {
  module_id: string;
  status: ModuleStatus | null;
  progress_percent: number | null;
  completed_at: string | null;
  last_accessed_at: string | null;
};

type AnnouncementRow = {
  title: string;
  content: string;
  published_at: string | null;
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

export async function getStudentModules(studentId?: string): Promise<StudentModule[]> {
  if (!isSupabaseConfigured) return demoStudentModules;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('modules')
      .select('id, slug, title, description, estimated_minutes, order_index')
      .eq('status', 'published')
      .order('order_index', { ascending: true });

    if (error) throw error;
    const rows = (data ?? []) as ModuleRow[];

    if (!rows.length) return [];

    const moduleIds = rows.map((moduleRow) => moduleRow.id);
    const [lessonsResult, progressResult] = await Promise.all([
      supabase.from('lessons').select('id, module_id').in('module_id', moduleIds),
      studentId
        ? supabase
            .from('module_progress')
            .select('module_id, status, progress_percent, completed_at, last_accessed_at')
            .eq('student_id', studentId)
            .in('module_id', moduleIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    const lessonRows = lessonsResult.error ? [] : ((lessonsResult.data ?? []) as LessonRow[]);
    const progressRows = progressResult.error ? [] : ((progressResult.data ?? []) as ProgressRow[]);
    const lessonCountByModule = new Map<string, number>();
    const progressByModule = new Map<string, ProgressRow>();

    for (const lesson of lessonRows) {
      lessonCountByModule.set(lesson.module_id, (lessonCountByModule.get(lesson.module_id) ?? 0) + 1);
    }

    for (const progress of progressRows) {
      progressByModule.set(progress.module_id, progress);
    }

    const modules: StudentModule[] = [];

    rows.forEach((moduleRow, index) => {
      const progress = progressByModule.get(moduleRow.id);
      const progressPercent = clampProgress(progress?.progress_percent ?? 0);
      let status = resolveProgressStatus(progress, progressPercent);
      const previousModule = modules[index - 1];

      if (index > 0 && previousModule?.status !== 'completed') {
        status = 'locked';
      }

      modules.push({
        id: moduleRow.id,
        slug: moduleRow.slug,
        title: moduleRow.title,
        description: moduleRow.description,
        orderIndex: moduleRow.order_index ?? index + 1,
        status,
        lessonsCount: lessonCountByModule.get(moduleRow.id) ?? 0,
        duration: `${moduleRow.estimated_minutes ?? 30} menit`,
        progress: status === 'locked' ? 0 : progressPercent,
        completedAt: progress?.completed_at ?? undefined,
        lastAccessedAt: progress?.last_accessed_at ?? undefined,
      });
    });

    return modules;
  } catch {
    return demoStudentModules;
  }
}

export async function getStudentDashboardData(studentId?: string): Promise<StudentDashboardData> {
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
      activities: demoStudentActivities,
      isDemo: true,
    };
  }

  try {
    const supabase = await createClient();
    const modules = await getStudentModules(studentId);
    const [quizAttemptsResult, announcementsResult] = await Promise.all([
      studentId
        ? supabase
            .from('quiz_attempts')
            .select('id', { count: 'exact', head: true })
            .eq('student_id', studentId)
        : Promise.resolve({ count: 0, error: null }),
      supabase
        .from('announcements')
        .select('title, content, published_at')
        .not('published_at', 'is', null)
        .order('published_at', { ascending: false })
        .limit(3),
    ]);

    const completedModules = modules.filter((moduleItem) => moduleItem.status === 'completed').length;
    const quizAttemptsCount = quizAttemptsResult.error ? 0 : quizAttemptsResult.count ?? 0;
    const announcements = announcementsResult.error
      ? []
      : ((announcementsResult.data ?? []) as AnnouncementRow[]);

    return {
      modules,
      quizAttemptsCount,
      streakDays: Math.min(Math.max(completedModules, 0) + (quizAttemptsCount > 0 ? 1 : 0), 14),
      points: completedModules * 150 + quizAttemptsCount * 50,
      announcements,
      activities: buildActivities(modules, quizAttemptsCount),
      isDemo: false,
    };
  } catch {
    return {
      modules: demoStudentModules,
      quizAttemptsCount: 18,
      streakDays: 7,
      points: 2450,
      announcements: [],
      activities: demoStudentActivities,
      isDemo: true,
    };
  }
}

export async function getStudentModule(moduleId: string, studentId?: string) {
  const modules = await getStudentModules(studentId);
  return modules.find((moduleItem) => moduleItem.id === moduleId || moduleItem.slug === moduleId) ?? modules[0];
}

function resolveProgressStatus(progress: ProgressRow | undefined, progressPercent: number): ModuleStatus {
  if (!progress) return 'not_started';
  if (progress.status === 'completed' || progress.completed_at || progressPercent >= 100) return 'completed';
  if (progress.status === 'in_progress' || progressPercent > 0) return 'in_progress';
  return 'not_started';
}

function clampProgress(value: number) {
  return Math.min(Math.max(Math.round(value), 0), 100);
}

function buildActivities(modules: StudentModule[], quizAttemptsCount: number): StudentActivity[] {
  const completed = modules.find((moduleItem) => moduleItem.status === 'completed');
  const active = modules.find((moduleItem) => moduleItem.status === 'in_progress');
  const activities: StudentActivity[] = [];

  if (quizAttemptsCount > 0) {
    activities.push({ title: `Mengerjakan ${quizAttemptsCount} kuis`, time: 'Terbaru', type: 'quiz' });
  }

  if (active) {
    activities.push({ title: `Melanjutkan modul "${active.title}"`, time: 'Hari ini', type: 'module' });
  }

  if (completed) {
    activities.push({ title: `Menyelesaikan modul "${completed.title}"`, time: 'Sebelumnya', type: 'module' });
  }

  return activities.length ? activities : demoStudentActivities;
}
