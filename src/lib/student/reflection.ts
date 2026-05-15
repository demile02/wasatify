import { demoStudentModules } from '@/lib/demo/student';
import { getStudentModules } from '@/lib/student/data';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import type { ModuleStatus } from '@/lib/types';

export type ReflectionModuleOption = {
  id: string;
  title: string;
  description: string;
  status: ModuleStatus;
  progress: number;
};

export type ReflectionDraft = {
  moduleId: string;
  reflectionText: string;
  actionPlan: string;
};

export type ReflectionPageData = {
  modules: ReflectionModuleOption[];
  selectedModule: ReflectionModuleOption | null;
  existingReflection: ReflectionDraft | null;
  locked: boolean;
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

type ReflectionRow = {
  module_id: string;
  reflection_text: string;
  action_plan: string | null;
};

export async function getReflectionPageData(
  studentId: string,
  requestedModuleId?: string,
): Promise<ReflectionPageData> {
  if (!isSupabaseConfigured) {
    const modules = await getReflectionModuleOptions(studentId);
    const selectedModule = requestedModuleId
      ? modules.find((moduleItem) => moduleItem.id === requestedModuleId) ?? null
      : modules[0] ?? null;

    return {
      modules,
      selectedModule,
      existingReflection: null,
      locked: selectedModule?.status === 'locked',
    };
  }

  const allModules = await getStudentModules(studentId);
  const unlockedStartedModules = allModules.filter(
    (moduleItem) => moduleItem.status !== 'locked' && moduleItem.status !== 'not_started',
  );
  const requestedModule = requestedModuleId
    ? allModules.find((moduleItem) => moduleItem.id === requestedModuleId || moduleItem.slug === requestedModuleId) ?? null
    : null;
  const selectedSource = requestedModule ?? unlockedStartedModules[0] ?? null;
  const modules = (requestedModule ? [requestedModule] : unlockedStartedModules).map(mapStudentModuleToOption);
  const selectedModule = selectedSource ? mapStudentModuleToOption(selectedSource) : null;
  const existingReflection = selectedModule ? await getExistingReflection(studentId, selectedModule.id) : null;

  return {
    modules,
    selectedModule,
    existingReflection,
    locked: selectedModule?.status === 'locked',
  };
}

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

async function getExistingReflection(studentId: string, moduleId: string): Promise<ReflectionDraft | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('reflections')
    .select('module_id, reflection_text, action_plan')
    .eq('student_id', studentId)
    .eq('module_id', moduleId)
    .maybeSingle<ReflectionRow>();

  if (!data) return null;

  return {
    moduleId: data.module_id,
    reflectionText: data.reflection_text,
    actionPlan: data.action_plan ?? '',
  };
}

function mapStudentModuleToOption(moduleItem: {
  id: string;
  title: string;
  description: string;
  status: ModuleStatus;
  progress: number;
}): ReflectionModuleOption {
  return {
    id: moduleItem.id,
    title: moduleItem.title,
    description: moduleItem.description,
    status: moduleItem.status,
    progress: moduleItem.progress,
  };
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
