import type { ModuleStatus } from '@/lib/types';

export type ReflectionNextStep = 'reflection' | 'lessons' | 'quiz';

export function resolveReflectionEligibility({
  moduleStatus,
  lessonsCompleted,
  hasQuiz,
  hasPassedQuiz,
}: {
  moduleStatus: ModuleStatus;
  lessonsCompleted?: boolean;
  hasQuiz: boolean;
  hasPassedQuiz: boolean;
}) {
  const lessonsFinished = lessonsCompleted ?? moduleStatus === 'completed';
  const eligible = lessonsFinished && (!hasQuiz || hasPassedQuiz);
  const nextStep: ReflectionNextStep = eligible ? 'reflection' : lessonsFinished && hasQuiz ? 'quiz' : 'lessons';

  return {
    lessonsFinished,
    eligible,
    nextStep,
    blockedReason: eligible
      ? null
      : nextStep === 'quiz'
        ? 'Selesaikan kuis terlebih dahulu'
        : 'Selesaikan materi modul terlebih dahulu',
  } as const;
}
