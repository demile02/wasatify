export type TeacherProgressStudent = {
  id: string;
};

export type TeacherProgressRow = {
  student_id: string;
  module_id: string;
  progress_percent: number | null;
  status?: string | null;
  completed_at?: string | null;
};

export type TeacherQuizScoreRow = {
  student_id: string;
  quiz_id: string;
  score: number | null;
};

export function calculateStudentProgressForModules(
  studentId: string,
  moduleIds: string[],
  progressRows: TeacherProgressRow[],
) {
  if (!moduleIds.length) return 0;

  const progressByModule = new Map(
    progressRows
      .filter((progress) => progress.student_id === studentId)
      .map((progress) => [progress.module_id, clampProgress(progress.progress_percent ?? 0)]),
  );

  const totalProgress = moduleIds.reduce((total, moduleId) => total + (progressByModule.get(moduleId) ?? 0), 0);

  return Math.round(totalProgress / moduleIds.length);
}

export function calculateClassProgress(
  students: TeacherProgressStudent[],
  moduleIds: string[],
  progressRows: TeacherProgressRow[],
) {
  if (!students.length || !moduleIds.length) return 0;

  const totalProgress = students.reduce(
    (total, student) => total + calculateStudentProgressForModules(student.id, moduleIds, progressRows),
    0,
  );

  return Math.round(totalProgress / students.length);
}

export function calculateModuleAverageProgress(
  moduleId: string,
  students: TeacherProgressStudent[],
  progressRows: TeacherProgressRow[],
) {
  if (!students.length) return 0;

  const progressByStudent = new Map(
    progressRows
      .filter((progress) => progress.module_id === moduleId)
      .map((progress) => [progress.student_id, clampProgress(progress.progress_percent ?? 0)]),
  );

  const totalProgress = students.reduce((total, student) => total + (progressByStudent.get(student.id) ?? 0), 0);

  return Math.round(totalProgress / students.length);
}

export function countCompletedModulesForStudent(
  studentId: string,
  moduleIds: string[],
  progressRows: TeacherProgressRow[],
) {
  const moduleIdSet = new Set(moduleIds);

  return progressRows.filter(
    (progress) =>
      progress.student_id === studentId &&
      moduleIdSet.has(progress.module_id) &&
      (progress.status === 'completed' || Boolean(progress.completed_at) || progress.progress_percent === 100),
  ).length;
}

export function averageBestQuizScore(attempts: TeacherQuizScoreRow[]) {
  const bestByStudentQuiz = new Map<string, number>();

  for (const attempt of attempts) {
    if (typeof attempt.score !== 'number') continue;
    const key = `${attempt.student_id}:${attempt.quiz_id}`;
    const score = Math.round(Number(attempt.score));
    bestByStudentQuiz.set(key, Math.max(bestByStudentQuiz.get(key) ?? 0, score));
  }

  const scores = [...bestByStudentQuiz.values()];
  return scores.length ? Math.round(scores.reduce((total, score) => total + score, 0) / scores.length) : 0;
}

function clampProgress(value: number) {
  return Math.min(Math.max(Math.round(value), 0), 100);
}
