import { demoStudentModules } from '@/lib/demo/student';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import type { ModuleStatus } from '@/lib/types';

export type ReflectionModuleOption = {
  id: string;
  title: string;
  description: string;
  status: ModuleStatus;
  progress: number;
};

type ModuleRow = {
  id: string;
  title: string;
  description: string;
};

type ProgressRow = {
  module_id: string;
  status: ModuleStatus | null;
  progress_percent: number | null;
  completed_at: string | null;
};

export async function getReflectionModuleOptions(studentId: string): Promise<ReflectionModuleOption[]> {
  if (!isSupabaseConfigured) {
    return demoStudentModules
      .filter((moduleItem) => moduleItem.status !== 'locked')
      .map((moduleItem) => ({
        id: moduleItem.id,
        title: moduleItem.title,
        description: moduleItem.description,
        status: moduleItem.status,
        progress: moduleItem.progress,
      }));
  }

  try {
    const supabase = await createClient();
    const { data: moduleRows, error: moduleError } = await supabase
      .from('modules')
      .select('id, title, description')
      .eq('status', 'published')
      .order('order_index', { ascending: true });

    if (moduleError) throw moduleError;

    const modules = (moduleRows ?? []) as ModuleRow[];
    if (!modules.length) return [];

    const { data: progressRows } = await supabase
      .from('module_progress')
      .select('module_id, status, progress_percent, completed_at')
      .eq('student_id', studentId)
      .in(
        'module_id',
        modules.map((moduleItem) => moduleItem.id),
      );

    const progressByModule = new Map(
      ((progressRows ?? []) as ProgressRow[]).map((progress) => [progress.module_id, progress]),
    );

    return modules.map((moduleItem) => {
      const progress = progressByModule.get(moduleItem.id);
      const progressPercent = clampProgress(progress?.progress_percent ?? 0);

      return {
        id: moduleItem.id,
        title: moduleItem.title,
        description: moduleItem.description,
        status: resolveProgressStatus(progress, progressPercent),
        progress: progressPercent,
      };
    });
  } catch {
    return [];
  }
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
