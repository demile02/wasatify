import type { ModuleStatus, StudentLearningModule } from '@/lib/types';

export type PublishedModuleRow = {
  id: string;
  slug: string;
  title: string;
  description: string;
  cover_image_path?: string | null;
  estimated_minutes: number | null;
  order_index: number | null;
};

export type ModuleProgressRow = {
  module_id: string;
  status: ModuleStatus | null;
  progress_percent: number | null;
  completed_at: string | null;
  last_accessed_at: string | null;
};

export type LessonCountRow = {
  module_id: string;
};

export function mergeModulesWithStudentProgress({
  modules,
  lessons,
  progressRows,
}: {
  modules: PublishedModuleRow[];
  lessons: LessonCountRow[];
  progressRows: ModuleProgressRow[];
}): StudentLearningModule[] {
  const lessonCountByModule = new Map<string, number>();
  const progressByModule = new Map<string, ModuleProgressRow>();

  for (const lesson of lessons) {
    lessonCountByModule.set(lesson.module_id, (lessonCountByModule.get(lesson.module_id) ?? 0) + 1);
  }

  for (const progress of progressRows) {
    progressByModule.set(progress.module_id, progress);
  }

  const sortedModules = [...modules].sort((first, second) => {
    const firstOrder = first.order_index ?? Number.MAX_SAFE_INTEGER;
    const secondOrder = second.order_index ?? Number.MAX_SAFE_INTEGER;
    if (firstOrder !== secondOrder) return firstOrder - secondOrder;
    return first.title.localeCompare(second.title);
  });

  const mergedModules: StudentLearningModule[] = [];

  sortedModules.forEach((moduleRow, index) => {
    const progress = progressByModule.get(moduleRow.id);
    const progressPercent = clampProgress(progress?.progress_percent ?? 0);
    let status = resolveStudentModuleStatus(progress, progressPercent);
    const previousModule = mergedModules[index - 1];

    if (index > 0 && previousModule?.status !== 'completed') {
      status = 'locked';
    }

    const estimatedMinutes = Math.max(Math.round(moduleRow.estimated_minutes ?? 30), 1);

    mergedModules.push({
      id: moduleRow.id,
      slug: moduleRow.slug,
      title: moduleRow.title,
      description: moduleRow.description,
      orderIndex: moduleRow.order_index ?? index + 1,
      status,
      lessonsCount: lessonCountByModule.get(moduleRow.id) ?? 0,
      estimatedMinutes,
      duration: `${estimatedMinutes} menit`,
      progress: status === 'locked' ? 0 : progressPercent,
      imageSrc: moduleRow.cover_image_path || undefined,
      completedAt: progress?.completed_at ?? undefined,
      lastAccessedAt: progress?.last_accessed_at ?? undefined,
    });
  });

  return mergedModules;
}

export function resolveStudentModuleStatus(
  progress: ModuleProgressRow | undefined,
  progressPercent: number,
): ModuleStatus {
  if (!progress) return 'not_started';
  if (progress.status === 'completed' || progress.completed_at || progressPercent >= 100) return 'completed';
  if (progress.status === 'in_progress' || progressPercent > 0) return 'in_progress';
  return 'not_started';
}

export function clampProgress(value: number) {
  return Math.min(Math.max(Math.round(value), 0), 100);
}
