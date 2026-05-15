import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import type { Profile } from '@/lib/types';

export type TeacherClassInfo = {
  id: string;
  name: string;
  gradeLevel: string | null;
  academicYear?: string | null;
  description: string | null;
};

export type TeacherMetrics = {
  completionRate: number;
  averageQuizScore: number;
  reflectionsCount: number;
  activitiesCount: number;
};

export type TeacherStudentProgress = {
  id: string;
  name: string;
  email: string | null;
  progress: number;
  averageQuizScore: number;
  reflectionsCount: number;
  completedModules: number;
  lastActive: string | null;
};

export type TeacherClassModule = {
  id: string;
  title: string;
  status: 'published' | 'draft' | 'archived';
  lessonsCount: number;
  completionRate: number;
};

export type TeacherClassActivity = {
  id: string;
  title: string;
  description: string;
  date: string;
  type: 'quiz' | 'reflection' | 'module';
};

export type TeacherReportStudentRow = {
  id: string;
  className: string;
  student: string;
  completedModules: number;
  averageQuizScore: number;
  reflectionCount: number;
  lastActiveAt: string | null;
  progress: number;
};

export type TeacherReportModuleSummary = {
  id: string;
  title: string;
  completionRate: number;
  averageQuizScore: number;
  attemptsCount: number;
};

export type TeacherClassDetailData = {
  classInfo: TeacherClassInfo | null;
  metrics: TeacherMetrics;
  students: TeacherStudentProgress[];
  modules: TeacherClassModule[];
  activities: TeacherClassActivity[];
  isDemo: boolean;
};

export type TeacherReportScope = {
  classId: string;
  className: string;
  metrics: TeacherMetrics;
  completionTrend: { label: string; completion: number }[];
  quizDistribution: { label: string; count: number }[];
  reflectionRate: { label: string; reflections: number }[];
  activityRanking: { name: string; activities: number }[];
  topModules: TeacherReportModuleSummary[];
  students: TeacherReportStudentRow[];
  studentsNeedingAttention: TeacherReportStudentRow[];
};

export type TeacherReportsData = {
  classes: TeacherClassInfo[];
  scopes: TeacherReportScope[];
  isDemo: boolean;
};

type ClassRow = {
  id: string;
  name: string;
  description: string | null;
  grade_level: string | null;
  academic_year?: string | null;
};

type StudentRow = {
  id: string;
  full_name: string;
  email: string | null;
  class_id: string | null;
};

type ModuleRow = {
  id: string;
  title: string;
  class_id: string | null;
  status: 'published' | 'draft' | 'archived';
};

type LessonRow = {
  id: string;
  module_id: string;
};

type QuizAttemptRow = {
  id: string;
  quiz_id: string;
  student_id: string;
  score: number | null;
  submitted_at: string | null;
  created_at: string | null;
};

type QuizRow = {
  id: string;
  module_id: string;
  title: string;
};

type ModuleProgressRow = {
  student_id: string;
  module_id: string;
  status: 'completed' | 'in_progress' | 'not_started' | 'locked' | null;
  progress_percent: number | null;
  completed_at: string | null;
  updated_at: string | null;
  created_at: string | null;
};

type ReflectionRow = {
  id: string;
  student_id: string;
  module_id: string;
  created_at: string;
};

export async function getTeacherClassDetailData(
  profile: Profile,
  classId: string,
): Promise<TeacherClassDetailData> {
  if (!isSupabaseConfigured) return buildDemoClassDetail(classId);

  try {
    const source = await loadTeacherAnalyticsSource(profile, classId);
    const classInfo = source.classes[0];

    if (!classInfo) {
      return emptyClassDetail(false);
    }

    return buildClassDetailFromSource(source, classInfo);
  } catch {
    return emptyClassDetail(false);
  }
}

export async function getTeacherReportsData(profile: Profile): Promise<TeacherReportsData> {
  if (!isSupabaseConfigured) return buildDemoReports();

  try {
    const source = await loadTeacherAnalyticsSource(profile);
    const classes = source.classes.map(mapClassInfo);
    const scopes: TeacherReportScope[] = [
      buildReportScope('all', 'Semua Kelas', source),
      ...source.classes.map((classRow) =>
        buildReportScope(classRow.id, classRow.name, filterSourceByClass(source, classRow.id)),
      ),
    ];

    return { classes, scopes, isDemo: false };
  } catch {
    return { classes: [], scopes: [emptyReportScope('all', 'Semua Kelas')], isDemo: false };
  }
}

async function loadTeacherAnalyticsSource(profile: Profile, classId?: string) {
  const supabase = await createClient();
  let classQuery = supabase
    .from('classes')
    .select('id, name, description, grade_level, academic_year')
    .order('name', { ascending: true });

  if (classId) {
    classQuery = classQuery.eq('id', classId);
  }

  if (profile.role !== 'admin') {
    classQuery = classQuery.eq('teacher_id', profile.id);
  }

  const { data: classRows, error: classError } = await classQuery;
  if (classError) throw classError;

  const classes = (classRows ?? []) as ClassRow[];
  const classIds = classes.map((classItem) => classItem.id);

  const studentsResult = classIds.length
    ? await supabase
        .from('profiles')
        .select('id, full_name, email, class_id')
        .eq('role', 'student')
        .in('class_id', classIds)
    : { data: [], error: null };

  if (studentsResult.error) throw studentsResult.error;

  const students = (studentsResult.data ?? []) as StudentRow[];
  const studentIds = students.map((student) => student.id);

  let moduleQuery = supabase.from('modules').select('id, title, class_id, status').order('order_index', { ascending: true });

  if (classId) {
    moduleQuery = moduleQuery.eq('class_id', classId);
  } else if (classIds.length) {
    moduleQuery = moduleQuery.in('class_id', classIds);
  }

  const { data: moduleRows, error: moduleError } = await moduleQuery;
  if (moduleError) throw moduleError;

  const modules = (moduleRows ?? []) as ModuleRow[];
  const moduleIds = modules.map((moduleItem) => moduleItem.id);

  const [lessonsResult, quizzesResult, progressResult, attemptsResult, reflectionsResult] = await Promise.all([
    moduleIds.length
      ? supabase.from('lessons').select('id, module_id').in('module_id', moduleIds)
      : Promise.resolve({ data: [], error: null }),
    moduleIds.length
      ? supabase.from('quizzes').select('id, module_id, title').in('module_id', moduleIds)
      : Promise.resolve({ data: [], error: null }),
    studentIds.length
      ? supabase
          .from('module_progress')
          .select('student_id, module_id, status, progress_percent, completed_at, updated_at, created_at')
          .in('student_id', studentIds)
      : Promise.resolve({ data: [], error: null }),
    studentIds.length
      ? supabase
          .from('quiz_attempts')
          .select('id, quiz_id, student_id, score, submitted_at, created_at')
          .in('student_id', studentIds)
      : Promise.resolve({ data: [], error: null }),
    studentIds.length
      ? supabase.from('reflections').select('id, student_id, module_id, created_at').in('student_id', studentIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (lessonsResult.error || quizzesResult.error || progressResult.error || attemptsResult.error || reflectionsResult.error) {
    throw lessonsResult.error ?? quizzesResult.error ?? progressResult.error ?? attemptsResult.error ?? reflectionsResult.error;
  }

  return {
    classes,
    students,
    modules,
    lessons: (lessonsResult.data ?? []) as LessonRow[],
    quizzes: (quizzesResult.data ?? []) as QuizRow[],
    progressRows: (progressResult.data ?? []) as ModuleProgressRow[],
    quizAttempts: (attemptsResult.data ?? []) as QuizAttemptRow[],
    reflections: (reflectionsResult.data ?? []) as ReflectionRow[],
  };
}

function buildClassDetailFromSource(
  source: Awaited<ReturnType<typeof loadTeacherAnalyticsSource>>,
  classRow: ClassRow,
): TeacherClassDetailData {
  return {
    classInfo: mapClassInfo(classRow),
    metrics: calculateMetrics(source.progressRows, source.quizAttempts, source.reflections),
    students: buildStudentProgress(source.students, source.progressRows, source.quizAttempts, source.reflections),
    modules: buildClassModules(source.modules, source.lessons, source.progressRows, source.students.length),
    activities: buildClassActivities(source.students, source.modules, source.progressRows, source.quizAttempts, source.reflections),
    isDemo: false,
  };
}

function buildReportScope(
  classId: string,
  className: string,
  source: Awaited<ReturnType<typeof loadTeacherAnalyticsSource>>,
): TeacherReportScope {
  const students = buildReportStudents(source);
  const topModules = buildReportModuleSummaries(source).sort((first, second) => second.completionRate - first.completionRate);

  return {
    classId,
    className,
    metrics: calculateMetrics(source.progressRows, source.quizAttempts, source.reflections),
    completionTrend: buildCompletionTrend(source.progressRows),
    quizDistribution: buildQuizDistribution(source.quizAttempts),
    reflectionRate: buildReflectionRate(source.reflections),
    activityRanking: buildActivityRanking(source.students, source.progressRows, source.quizAttempts, source.reflections),
    topModules: topModules.slice(0, 8),
    students,
    studentsNeedingAttention: students
      .filter((student) => student.progress < 50 || student.averageQuizScore < 70 || student.reflectionCount === 0)
      .sort((first, second) => first.progress - second.progress)
      .slice(0, 8),
  };
}

function filterSourceByClass(source: Awaited<ReturnType<typeof loadTeacherAnalyticsSource>>, classId: string) {
  const students = source.students.filter((student) => student.class_id === classId);
  const studentIds = new Set(students.map((student) => student.id));
  const modules = source.modules.filter((moduleItem) => moduleItem.class_id === classId);
  const moduleIds = new Set(modules.map((moduleItem) => moduleItem.id));

  return {
    classes: source.classes.filter((classItem) => classItem.id === classId),
    students,
    modules,
    lessons: source.lessons.filter((lesson) => moduleIds.has(lesson.module_id)),
    quizzes: source.quizzes.filter((quiz) => moduleIds.has(quiz.module_id)),
    progressRows: source.progressRows.filter((progress) => studentIds.has(progress.student_id)),
    quizAttempts: source.quizAttempts.filter((attempt) => studentIds.has(attempt.student_id)),
    reflections: source.reflections.filter((reflection) => studentIds.has(reflection.student_id)),
  };
}

function calculateMetrics(
  progressRows: ModuleProgressRow[],
  quizAttempts: QuizAttemptRow[],
  reflections: ReflectionRow[],
): TeacherMetrics {
  const completionRate = progressRows.length
    ? Math.round(progressRows.reduce((total, progress) => total + clamp(progress.progress_percent ?? 0), 0) / progressRows.length)
    : 0;
  const scoredAttempts = quizAttempts.filter((attempt) => typeof attempt.score === 'number');
  const averageQuizScore = scoredAttempts.length
    ? Math.round(scoredAttempts.reduce((total, attempt) => total + Number(attempt.score ?? 0), 0) / scoredAttempts.length)
    : 0;

  return {
    completionRate,
    averageQuizScore,
    reflectionsCount: reflections.length,
    activitiesCount: progressRows.length + quizAttempts.length + reflections.length,
  };
}

function buildStudentProgress(
  students: StudentRow[],
  progressRows: ModuleProgressRow[],
  quizAttempts: QuizAttemptRow[],
  reflections: ReflectionRow[],
): TeacherStudentProgress[] {
  const progressByStudent = groupBy(progressRows, (progress) => progress.student_id);
  const attemptsByStudent = groupBy(quizAttempts, (attempt) => attempt.student_id);
  const reflectionsByStudent = groupBy(reflections, (reflection) => reflection.student_id);

  return students.map((student) => {
    const studentProgress = progressByStudent.get(student.id) ?? [];
    const studentAttempts = attemptsByStudent.get(student.id) ?? [];
    const studentReflections = reflectionsByStudent.get(student.id) ?? [];
    const scoredAttempts = studentAttempts.filter((attempt) => typeof attempt.score === 'number');
    const activityDates = [
      ...studentProgress.map((progress) => progress.completed_at ?? progress.updated_at ?? progress.created_at),
      ...studentAttempts.map((attempt) => attempt.submitted_at ?? attempt.created_at),
      ...studentReflections.map((reflection) => reflection.created_at),
    ].filter((value): value is string => Boolean(value));

    return {
      id: student.id,
      name: student.full_name,
      email: student.email,
      progress: studentProgress.length
        ? Math.round(studentProgress.reduce((total, progress) => total + clamp(progress.progress_percent ?? 0), 0) / studentProgress.length)
        : 0,
      averageQuizScore: scoredAttempts.length
        ? Math.round(scoredAttempts.reduce((total, attempt) => total + Number(attempt.score ?? 0), 0) / scoredAttempts.length)
        : 0,
      reflectionsCount: studentReflections.length,
      completedModules: studentProgress.filter(
        (progress) => progress.status === 'completed' || progress.completed_at || progress.progress_percent === 100,
      ).length,
      lastActive: latestDate(activityDates),
    };
  });
}

function buildReportStudents(source: Awaited<ReturnType<typeof loadTeacherAnalyticsSource>>): TeacherReportStudentRow[] {
  const classById = new Map(source.classes.map((classItem) => [classItem.id, classItem]));
  const studentProgress = buildStudentProgress(source.students, source.progressRows, source.quizAttempts, source.reflections);

  return studentProgress.map((student) => {
    const classId = source.students.find((studentRow) => studentRow.id === student.id)?.class_id ?? null;

    return {
      id: student.id,
      className: classId ? classById.get(classId)?.name ?? 'Tanpa kelas' : 'Tanpa kelas',
      student: student.name,
      completedModules: student.completedModules,
      averageQuizScore: student.averageQuizScore,
      reflectionCount: student.reflectionsCount,
      lastActiveAt: student.lastActive,
      progress: student.progress,
    };
  });
}

function buildReportModuleSummaries(source: Awaited<ReturnType<typeof loadTeacherAnalyticsSource>>): TeacherReportModuleSummary[] {
  const quizById = new Map(source.quizzes.map((quiz) => [quiz.id, quiz]));
  const moduleRows = buildClassModules(source.modules, source.lessons, source.progressRows, source.students.length);

  return moduleRows.map((moduleItem) => {
    const moduleAttempts = source.quizAttempts.filter((attempt) => quizById.get(attempt.quiz_id)?.module_id === moduleItem.id);
    const scoredAttempts = moduleAttempts.filter((attempt) => typeof attempt.score === 'number');

    return {
      id: moduleItem.id,
      title: moduleItem.title,
      completionRate: moduleItem.completionRate,
      averageQuizScore: scoredAttempts.length
        ? Math.round(scoredAttempts.reduce((total, attempt) => total + Number(attempt.score ?? 0), 0) / scoredAttempts.length)
        : 0,
      attemptsCount: moduleAttempts.length,
    };
  });
}

function buildClassModules(
  modules: ModuleRow[],
  lessons: LessonRow[],
  progressRows: ModuleProgressRow[],
  studentsCount: number,
): TeacherClassModule[] {
  const lessonCountByModule = countBy(lessons, (lesson) => lesson.module_id);

  return modules.map((moduleItem) => {
    const moduleProgress = progressRows.filter((progress) => progress.module_id === moduleItem.id);
    const completedCount = moduleProgress.filter(
      (progress) => progress.status === 'completed' || progress.completed_at || progress.progress_percent === 100,
    ).length;

    return {
      id: moduleItem.id,
      title: moduleItem.title,
      status: moduleItem.status,
      lessonsCount: lessonCountByModule.get(moduleItem.id) ?? 0,
      completionRate: studentsCount ? Math.round((completedCount / studentsCount) * 100) : 0,
    };
  });
}

function buildClassActivities(
  students: StudentRow[],
  modules: ModuleRow[],
  progressRows: ModuleProgressRow[],
  quizAttempts: QuizAttemptRow[],
  reflections: ReflectionRow[],
): TeacherClassActivity[] {
  const studentById = new Map(students.map((student) => [student.id, student]));
  const moduleById = new Map(modules.map((moduleItem) => [moduleItem.id, moduleItem]));
  const activities: TeacherClassActivity[] = [
    ...quizAttempts.map((attempt) => ({
      id: `quiz-${attempt.id}`,
      title: `${studentById.get(attempt.student_id)?.full_name ?? 'Siswa'} menyelesaikan kuis`,
      description: typeof attempt.score === 'number' ? `Skor ${Math.round(Number(attempt.score))}` : 'Kuis tersimpan',
      date: attempt.submitted_at ?? attempt.created_at ?? new Date().toISOString(),
      type: 'quiz' as const,
    })),
    ...reflections.map((reflection) => ({
      id: `reflection-${reflection.id}`,
      title: `${studentById.get(reflection.student_id)?.full_name ?? 'Siswa'} mengumpulkan refleksi`,
      description: moduleById.get(reflection.module_id)?.title ?? 'Modul pembelajaran',
      date: reflection.created_at,
      type: 'reflection' as const,
    })),
    ...progressRows
      .filter((progress) => progress.status === 'completed' || progress.completed_at || progress.progress_percent === 100)
      .map((progress) => ({
        id: `module-${progress.student_id}-${progress.module_id}`,
        title: `${studentById.get(progress.student_id)?.full_name ?? 'Siswa'} menyelesaikan modul`,
        description: moduleById.get(progress.module_id)?.title ?? 'Modul pembelajaran',
        date: progress.completed_at ?? progress.updated_at ?? progress.created_at ?? new Date().toISOString(),
        type: 'module' as const,
      })),
  ];

  return activities
    .sort((first, second) => new Date(second.date).getTime() - new Date(first.date).getTime())
    .slice(0, 12);
}

function buildCompletionTrend(progressRows: ModuleProgressRow[]) {
  const grouped = groupBy(progressRows, (progress) => dateLabel(progress.updated_at ?? progress.completed_at ?? progress.created_at));

  return [...grouped.entries()]
    .filter(([label]) => label !== '-')
    .map(([label, rows]) => ({
      label,
      completion: rows.length
        ? Math.round(rows.reduce((total, progress) => total + clamp(progress.progress_percent ?? 0), 0) / rows.length)
        : 0,
    }))
    .slice(-8);
}

function buildQuizDistribution(quizAttempts: QuizAttemptRow[]) {
  const bins = [
    { label: '90-100', count: 0 },
    { label: '80-89', count: 0 },
    { label: '70-79', count: 0 },
    { label: '<70', count: 0 },
  ];

  for (const attempt of quizAttempts) {
    const score = Number(attempt.score ?? 0);
    if (score >= 90) bins[0].count += 1;
    else if (score >= 80) bins[1].count += 1;
    else if (score >= 70) bins[2].count += 1;
    else bins[3].count += 1;
  }

  return bins;
}

function buildReflectionRate(reflections: ReflectionRow[]) {
  const grouped = groupBy(reflections, (reflection) => dateLabel(reflection.created_at));

  return [...grouped.entries()]
    .filter(([label]) => label !== '-')
    .map(([label, rows]) => ({ label, reflections: rows.length }))
    .slice(-8);
}

function buildActivityRanking(
  students: StudentRow[],
  progressRows: ModuleProgressRow[],
  quizAttempts: QuizAttemptRow[],
  reflections: ReflectionRow[],
) {
  return students
    .map((student) => ({
      name: student.full_name,
      activities:
        progressRows.filter((progress) => progress.student_id === student.id).length +
        quizAttempts.filter((attempt) => attempt.student_id === student.id).length +
        reflections.filter((reflection) => reflection.student_id === student.id).length,
    }))
    .filter((student) => student.activities > 0)
    .sort((first, second) => second.activities - first.activities)
    .slice(0, 6);
}

function buildDemoClassDetail(classId: string): TeacherClassDetailData {
  const students: TeacherStudentProgress[] = [
    {
      id: 'demo-student-1',
      name: 'Aisyah Putri',
      email: 'aisyah@example.test',
      progress: 92,
      averageQuizScore: 88,
      reflectionsCount: 3,
      completedModules: 5,
      lastActive: new Date().toISOString(),
    },
    {
      id: 'demo-student-2',
      name: 'Muhammad Zaki',
      email: 'zaki@example.test',
      progress: 78,
      averageQuizScore: 82,
      reflectionsCount: 2,
      completedModules: 4,
      lastActive: new Date(Date.now() - 86400000).toISOString(),
    },
  ];

  return {
    classInfo: {
      id: classId,
      name: 'Kelas VIII - Akhlak & Adab',
      gradeLevel: 'VIII',
      description: 'Demo class WASATIFY',
    },
    metrics: {
      completionRate: 85,
      averageQuizScore: 84,
      reflectionsCount: 5,
      activitiesCount: 42,
    },
    students,
    modules: [
      { id: 'demo-module-1', title: 'Adab dalam Islam', status: 'published', lessonsCount: 8, completionRate: 88 },
      { id: 'demo-module-2', title: 'Tawazun', status: 'published', lessonsCount: 6, completionRate: 72 },
    ],
    activities: [
      {
        id: 'demo-activity-1',
        title: 'Aisyah Putri menyelesaikan kuis',
        description: 'Skor 90',
        date: new Date().toISOString(),
        type: 'quiz',
      },
    ],
    isDemo: true,
  };
}

function buildDemoReports(): TeacherReportsData {
  const scope: TeacherReportScope = {
    classId: 'all',
    className: 'Semua Kelas',
    metrics: {
      completionRate: 85,
      averageQuizScore: 84,
      reflectionsCount: 32,
      activitiesCount: 210,
    },
    completionTrend: [
      { label: '1 Mei', completion: 42 },
      { label: '8 Mei', completion: 56 },
      { label: '15 Mei', completion: 68 },
      { label: '22 Mei', completion: 85 },
    ],
    quizDistribution: [
      { label: '90-100', count: 12 },
      { label: '80-89', count: 18 },
      { label: '70-79', count: 9 },
      { label: '<70', count: 3 },
    ],
    reflectionRate: [
      { label: '1 Mei', reflections: 6 },
      { label: '8 Mei', reflections: 12 },
      { label: '15 Mei', reflections: 9 },
      { label: '22 Mei', reflections: 15 },
    ],
    activityRanking: [
      { name: 'Aisyah', activities: 18 },
      { name: 'Zaki', activities: 15 },
      { name: 'Fatimah', activities: 12 },
    ],
    topModules: [
      { id: 'demo-module-1', title: 'Adab dalam Islam', completionRate: 88, averageQuizScore: 85, attemptsCount: 18 },
      { id: 'demo-module-2', title: 'Tawazun', completionRate: 72, averageQuizScore: 82, attemptsCount: 15 },
    ],
    students: [
      {
        id: 'demo-student-1',
        className: 'Kelas 8A',
        student: 'Aisyah Putri',
        completedModules: 5,
        averageQuizScore: 88,
        reflectionCount: 3,
        lastActiveAt: new Date().toISOString(),
        progress: 92,
      },
      {
        id: 'demo-student-2',
        className: 'Kelas 8A',
        student: 'Muhammad Zaki',
        completedModules: 2,
        averageQuizScore: 65,
        reflectionCount: 0,
        lastActiveAt: new Date(Date.now() - 86400000).toISOString(),
        progress: 42,
      },
    ],
    studentsNeedingAttention: [
      {
        id: 'demo-student-2',
        className: 'Kelas 8A',
        student: 'Muhammad Zaki',
        completedModules: 2,
        averageQuizScore: 65,
        reflectionCount: 0,
        lastActiveAt: new Date(Date.now() - 86400000).toISOString(),
        progress: 42,
      },
    ],
  };

  return {
    classes: [
      { id: 'demo-class-8a', name: 'Kelas 8A', gradeLevel: 'VIII', description: null },
      { id: 'demo-class-9a', name: 'Kelas 9A', gradeLevel: 'IX', description: null },
    ],
    scopes: [scope],
    isDemo: true,
  };
}

function emptyClassDetail(isDemo: boolean): TeacherClassDetailData {
  return {
    classInfo: null,
    metrics: {
      completionRate: 0,
      averageQuizScore: 0,
      reflectionsCount: 0,
      activitiesCount: 0,
    },
    students: [],
    modules: [],
    activities: [],
    isDemo,
  };
}

function emptyReportScope(classId: string, className: string): TeacherReportScope {
  return {
    classId,
    className,
    metrics: {
      completionRate: 0,
      averageQuizScore: 0,
      reflectionsCount: 0,
      activitiesCount: 0,
    },
    completionTrend: [],
    quizDistribution: buildQuizDistribution([]),
    reflectionRate: [],
    activityRanking: [],
    topModules: [],
    students: [],
    studentsNeedingAttention: [],
  };
}

function mapClassInfo(classRow: ClassRow): TeacherClassInfo {
  return {
    id: classRow.id,
    name: classRow.name,
    description: classRow.description,
    gradeLevel: classRow.grade_level,
    academicYear: classRow.academic_year ?? null,
  };
}

function groupBy<T>(items: T[], keyFn: (item: T) => string) {
  const groups = new Map<string, T[]>();

  for (const item of items) {
    const key = keyFn(item);
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }

  return groups;
}

function countBy<T>(items: T[], keyFn: (item: T) => string) {
  const counts = new Map<string, number>();

  for (const item of items) {
    const key = keyFn(item);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return counts;
}

function latestDate(values: string[]) {
  if (!values.length) return null;

  return values.sort((first, second) => new Date(second).getTime() - new Date(first).getTime())[0] ?? null;
}

function dateLabel(value: string | null | undefined) {
  if (!value) return '-';

  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(value));
}

function clamp(value: number) {
  return Math.min(Math.max(Math.round(value), 0), 100);
}
