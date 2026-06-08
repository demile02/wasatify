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

export type ReflectionCenterItem = ReflectionModuleOption & {
  reflectionId: string | null;
  reflectionText: string;
  actionPlan: string;
  teacherNote: string | null;
  reviewedAt: string | null;
  createdAt: string | null;
  hasValidReflection: boolean;
  hasQuiz: boolean;
  hasPassedQuiz: boolean;
  eligible: boolean;
  blockedReason: string | null;
  ctaHref: string;
  ctaLabel: string;
};

export type ReflectionCenterData = {
  modules: ReflectionModuleOption[];
  pending: ReflectionCenterItem[];
  completed: ReflectionCenterItem[];
};

export type ReflectionPageData = {
  modules: ReflectionModuleOption[];
  selectedModule: ReflectionModuleOption | null;
  existingReflection: ReflectionDraft | null;
  locked: boolean;
  lockedReason: string | null;
  lockedHref: string;
  lockedCtaLabel: string;
};

type ReflectionRow = {
  id?: string;
  module_id: string;
  reflection_text: string;
  action_plan: string | null;
  teacher_note?: string | null;
  reviewed_at?: string | null;
  created_at?: string | null;
};

type QuizRow = {
  id: string;
  module_id: string;
  passing_score: number | null;
};

type AttemptRow = {
  quiz_id: string;
  score: number | null;
  passed: boolean | null;
};

export async function getReflectionPageData(
  studentId: string,
  requestedModuleId?: string,
): Promise<ReflectionPageData> {
  if (!isSupabaseConfigured) {
    const centerData = await getReflectionCenterData(studentId);
    const selectedModule = requestedModuleId
      ? centerData.modules.find((moduleItem) => moduleItem.id === requestedModuleId) ?? null
      : centerData.modules[0] ?? null;

    return {
      modules: centerData.modules,
      selectedModule,
      existingReflection: null,
      locked: selectedModule?.status === 'locked',
      lockedReason: selectedModule?.status === 'locked' ? 'Selesaikan syarat modul terlebih dahulu.' : null,
      lockedHref: selectedModule ? `/student/modules/${selectedModule.id}` : '/student/reflection',
      lockedCtaLabel: selectedModule ? 'Lanjutkan Modul' : 'Kembali ke Refleksi',
    };
  }

  const centerData = await getReflectionCenterData(studentId);
  const centerItems = [...centerData.pending, ...centerData.completed];
  const requestedItem = requestedModuleId
    ? centerItems.find((moduleItem) => moduleItem.id === requestedModuleId)
    : null;
  const requestedBySlug = requestedModuleId && !requestedItem
    ? (await getStudentModules(studentId)).find((moduleItem) => moduleItem.slug === requestedModuleId)
    : null;
  const selectedItem = requestedItem
    ?? (requestedBySlug ? centerItems.find((moduleItem) => moduleItem.id === requestedBySlug.id) ?? null : null)
    ?? (!requestedModuleId ? centerItems.find((moduleItem) => moduleItem.eligible) ?? centerItems[0] ?? null : null);
  const selectedModule = selectedItem ? mapStudentModuleToOption(selectedItem) : null;
  const existingReflection = selectedModule ? await getExistingReflection(studentId, selectedModule.id) : null;
  const hasValidExistingReflection =
    Boolean(existingReflection?.reflectionText.trim().length && existingReflection.reflectionText.trim().length >= 30) &&
    Boolean(existingReflection?.actionPlan.trim().length && existingReflection.actionPlan.trim().length >= 20);
  const locked = !selectedItem || (!selectedItem.eligible && !hasValidExistingReflection);

  return {
    modules: centerData.modules,
    selectedModule,
    existingReflection,
    locked,
    lockedReason: selectedItem
      ? selectedItem.blockedReason
      : 'Refleksi belum bisa dibuat karena modul tidak tersedia untuk akunmu.',
    lockedHref: selectedItem?.blockedReason?.toLowerCase().includes('kuis')
      ? `/student/quizzes?moduleId=${selectedItem.id}`
      : selectedItem
        ? `/student/modules/${selectedItem.id}`
        : '/student/reflection',
    lockedCtaLabel: selectedItem?.blockedReason?.toLowerCase().includes('kuis')
      ? 'Buka Menu Kuis'
      : selectedItem
        ? 'Lanjutkan Modul'
        : 'Kembali ke Refleksi',
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
    return (await getStudentModules(studentId))
      .filter((moduleItem) => moduleItem.status !== 'locked')
      .map(mapStudentModuleToOption);
  } catch {
    return [];
  }
}

export async function getReflectionCenterData(studentId: string): Promise<ReflectionCenterData> {
  if (!isSupabaseConfigured) {
    const modules = await getReflectionModuleOptions(studentId);
    const items = modules.map((moduleItem, index) => buildDemoCenterItem(moduleItem, index));
    return {
      modules,
      pending: items.filter((item) => !item.hasValidReflection),
      completed: items.filter((item) => item.hasValidReflection),
    };
  }

  try {
    const modules = (await getStudentModules(studentId))
      .filter((moduleItem) => moduleItem.status !== 'locked')
      .map(mapStudentModuleToOption);
    const moduleIds = modules.map((moduleItem) => moduleItem.id);

    if (!moduleIds.length) return { modules: [], pending: [], completed: [] };

    const supabase = await createClient();
    const [reflectionsResult, quizzesResult] = await Promise.all([
      supabase
        .from('reflections')
        .select('id, module_id, reflection_text, action_plan, teacher_note, reviewed_at, created_at')
        .eq('student_id', studentId)
        .in('module_id', moduleIds),
      supabase
        .from('quizzes')
        .select('id, module_id, passing_score')
        .in('module_id', moduleIds)
        .eq('is_published', true),
    ]);

    if (reflectionsResult.error || quizzesResult.error) {
      throw reflectionsResult.error ?? quizzesResult.error;
    }

    const reflections = (reflectionsResult.data ?? []) as ReflectionRow[];
    const quizzes = (quizzesResult.data ?? []) as QuizRow[];
    const quizIds = quizzes.map((quiz) => quiz.id);
    const { data: attemptsData } = quizIds.length
      ? await supabase
          .from('quiz_attempts')
          .select('quiz_id, score, passed')
          .eq('student_id', studentId)
          .in('quiz_id', quizIds)
      : { data: [] };

    const reflectionByModule = new Map(reflections.map((reflection) => [reflection.module_id, reflection]));
    const quizzesByModule = groupBy(quizzes, (quiz) => quiz.module_id);
    const attemptsByQuiz = groupBy((attemptsData ?? []) as AttemptRow[], (attempt) => attempt.quiz_id);
    const items = modules.map((moduleItem) => {
      const reflection = reflectionByModule.get(moduleItem.id);
      const moduleQuizzes = quizzesByModule.get(moduleItem.id) ?? [];
      const hasQuiz = moduleQuizzes.length > 0;
      const hasPassedQuiz = moduleQuizzes.some((quiz) =>
        (attemptsByQuiz.get(quiz.id) ?? []).some(
          (attempt) => Boolean(attempt.passed) || Number(attempt.score ?? 0) >= (quiz.passing_score ?? 70),
        ),
      );
      const moduleFinished = moduleItem.status === 'completed' || moduleItem.progress >= 100;
      const eligible = hasQuiz ? hasPassedQuiz : moduleFinished;
      const hasValidReflection =
        Boolean(reflection?.reflection_text?.trim().length && reflection.reflection_text.trim().length >= 30) &&
        Boolean(reflection?.action_plan?.trim().length && (reflection.action_plan ?? '').trim().length >= 20);

      return {
        ...moduleItem,
        reflectionId: reflection?.id ?? null,
        reflectionText: reflection?.reflection_text ?? '',
        actionPlan: reflection?.action_plan ?? '',
        teacherNote: reflection?.teacher_note ?? null,
        reviewedAt: reflection?.reviewed_at ?? null,
        createdAt: reflection?.created_at ?? null,
        hasValidReflection,
        hasQuiz,
        hasPassedQuiz,
        eligible,
        blockedReason: eligible
          ? null
          : !moduleFinished
            ? 'Selesaikan materi modul terlebih dahulu'
            : hasQuiz
              ? 'Selesaikan kuis terlebih dahulu'
              : 'Selesaikan materi modul terlebih dahulu',
        ctaHref: eligible
          ? `/student/reflection?moduleId=${moduleItem.id}`
          : !moduleFinished
            ? `/student/modules/${moduleItem.id}`
            : hasQuiz
              ? `/student/quizzes?moduleId=${moduleItem.id}`
              : `/student/modules/${moduleItem.id}`,
        ctaLabel: eligible
          ? hasValidReflection
            ? 'Lihat / Edit Refleksi'
            : 'Tulis Refleksi'
          : !moduleFinished
            ? 'Selesaikan Modul Terlebih Dahulu'
            : hasQuiz
              ? 'Buka Menu Kuis'
              : 'Selesaikan Modul Terlebih Dahulu',
      } satisfies ReflectionCenterItem;
    });

    return {
      modules,
      pending: items.filter((item) => !item.hasValidReflection),
      completed: items.filter((item) => item.hasValidReflection),
    };
  } catch {
    return { modules: [], pending: [], completed: [] };
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

function buildDemoCenterItem(moduleItem: ReflectionModuleOption, index: number): ReflectionCenterItem {
  const completed = index === 0;
  const eligible = completed || moduleItem.status === 'completed' || moduleItem.progress >= 100;

  return {
    ...moduleItem,
    reflectionId: completed ? 'demo-reflection' : null,
    reflectionText: completed ? 'Saya memahami pentingnya sikap seimbang dalam belajar dan beribadah.' : '',
    actionPlan: completed ? 'Saya akan membuat jadwal belajar yang lebih teratur.' : '',
    teacherNote: completed ? 'Refleksi sudah baik, lanjutkan konsistensinya.' : null,
    reviewedAt: completed ? new Date().toISOString() : null,
    createdAt: completed ? new Date().toISOString() : null,
    hasValidReflection: completed,
    hasQuiz: true,
    hasPassedQuiz: eligible,
    eligible,
    blockedReason: eligible ? null : 'Selesaikan kuis terlebih dahulu',
    ctaHref: eligible ? `/student/reflection?moduleId=${moduleItem.id}` : `/student/quizzes?moduleId=${moduleItem.id}`,
    ctaLabel: completed ? 'Lihat / Edit Refleksi' : eligible ? 'Tulis Refleksi' : 'Buka Menu Kuis',
  };
}

function groupBy<T>(items: T[], keyGetter: (item: T) => string) {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const key = keyGetter(item);
    const rows = map.get(key) ?? [];
    rows.push(item);
    map.set(key, rows);
  }
  return map;
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
