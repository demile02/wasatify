import { readAllRows } from '@/lib/supabase/read-all-rows';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import {
  calculateClassProgressByGroup,
  calculateModuleAverageProgressForModules,
} from '@/lib/teacher/progress-calculation';
import { getTeacherSourceData } from '@/lib/teacher/source-data';
import type { Profile } from '@/lib/types';

export type TeacherModuleStatus = 'published' | 'draft' | 'archived';

export type TeacherModuleListItem = {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  lessonsCount: number;
  quizzesCount: number;
  duration: string;
  status: TeacherModuleStatus;
  coverImagePath: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type TeacherClassProgress = {
  id: string;
  name: string;
  studentsCount: number;
  progress: number;
};

export type TeacherActivity = {
  id: string;
  title: string;
  description: string;
  date: string;
  type: 'quiz' | 'reflection' | 'module';
};

export type TeacherAnnouncement = {
  id: string;
  title: string;
  content: string;
  priority: 'low' | 'normal' | 'high';
  publishedAt: string | null;
  createdAt: string;
};

export type TeacherDashboardData = {
  classesCount: number;
  studentsCount: number;
  quizzesCount: number;
  completionRate: number;
  classProgress: TeacherClassProgress[];
  activities: TeacherActivity[];
  moduleCompletion: {
    id: string;
    title: string;
    completionRate: number;
    completedCount: number;
    studentsCount: number;
  }[];
  announcements: TeacherAnnouncement[];
  isDemo: boolean;
};

type ClassRow = {
  id: string;
  name: string;
  grade_level: string | null;
};

type StudentRow = {
  id: string;
  full_name: string;
  class_id: string | null;
};

type ModuleRow = {
  id: string;
  slug: string;
  title: string;
  description: string;
  class_id: string | null;
  cover_image_path: string | null;
  tags?: string[] | null;
  status: TeacherModuleStatus;
  estimated_minutes: number | null;
  created_at: string | null;
  updated_at: string | null;
};

type LessonRow = {
  id: string;
  module_id: string;
};

type QuizRow = {
  id: string;
  title: string;
  module_id: string;
  created_at: string;
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

type QuizAttemptRow = {
  id: string;
  quiz_id: string;
  student_id: string;
  score: number | null;
  submitted_at: string | null;
  created_at: string | null;
};

type ReflectionRow = {
  id: string;
  student_id: string;
  module_id: string;
  created_at: string;
};

type AnnouncementRow = {
  id: string;
  title: string;
  content: string;
  priority: 'low' | 'normal' | 'high';
  published_at: string | null;
  created_at: string;
};

const demoTeacherModules: TeacherModuleListItem[] = [
  {
    id: 'demo-module-1',
    slug: 'adab-dalam-islam',
    title: 'Adab dalam Islam',
    description: 'Memahami pentingnya adab dalam kehidupan sehari-hari.',
    category: 'Akhlak',
    lessonsCount: 10,
    quizzesCount: 1,
    duration: '2j 30m',
    status: 'published',
    coverImagePath: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo-module-2',
    slug: 'tawazun-keseimbangan',
    title: 'Tawazun dan Keseimbangan',
    description: 'Belajar menjaga keseimbangan dunia dan akhirat.',
    category: 'Wasathiyah',
    lessonsCount: 6,
    quizzesCount: 0,
    duration: '1j 20m',
    status: 'draft',
    coverImagePath: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export async function getTeacherModules(profile?: Profile): Promise<TeacherModuleListItem[]> {
  if (!isSupabaseConfigured) return demoTeacherModules;

  try {
    const supabase = await createClient();
    let query = supabase
      .from('modules')
      .select('id, slug, title, description, class_id, cover_image_path, tags, status, estimated_minutes, created_at, updated_at')
      .order('order_index', { ascending: true })
      .order('updated_at', { ascending: false });

    if (profile?.role === 'teacher') {
      query = query.eq('created_by', profile.id);
    }

    const { data: moduleRows, error: moduleError } = await readAllRows(query.order('id'));

    if (moduleError) throw moduleError;

    const modules = (moduleRows ?? []) as ModuleRow[];
    if (!modules.length) return [];

    const moduleIds = modules.map((moduleItem) => moduleItem.id);
    const classIds = [...new Set(modules.map((moduleItem) => moduleItem.class_id).filter(Boolean))] as string[];
    const [lessonsResult, quizzesResult, classesResult] = await Promise.all([
      readAllRows(supabase.from('lessons').select('id, module_id').in('module_id', moduleIds).order('id')),
      readAllRows(supabase.from('quizzes').select('id, module_id').in('module_id', moduleIds).order('id')),
      classIds.length
        ? readAllRows(supabase.from('classes').select('id, name, grade_level').in('id', classIds).order('id'))
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (lessonsResult.error || quizzesResult.error || classesResult.error) throw lessonsResult.error ?? quizzesResult.error ?? classesResult.error;
    const lessons = lessonsResult.error ? [] : ((lessonsResult.data ?? []) as LessonRow[]);
    const quizzes = quizzesResult.error ? [] : ((quizzesResult.data ?? []) as QuizRow[]);
    const classes = classesResult.error ? [] : ((classesResult.data ?? []) as ClassRow[]);
    const lessonsCountByModule = countBy(lessons, (lesson) => lesson.module_id);
    const quizzesCountByModule = countBy(quizzes, (quiz) => quiz.module_id);
    const classById = new Map(classes.map((classItem) => [classItem.id, classItem]));

    return modules.map((moduleItem) => {
      const classItem = moduleItem.class_id ? classById.get(moduleItem.class_id) : undefined;

      return {
        id: moduleItem.id,
        slug: moduleItem.slug,
        title: moduleItem.title,
        description: moduleItem.description,
        category: moduleItem.tags?.[0] ?? classItem?.grade_level ?? classItem?.name ?? 'Umum',
        lessonsCount: lessonsCountByModule.get(moduleItem.id) ?? 0,
        quizzesCount: quizzesCountByModule.get(moduleItem.id) ?? 0,
        duration: formatDuration(moduleItem.estimated_minutes ?? 15),
        status: moduleItem.status,
        coverImagePath: moduleItem.cover_image_path,
        createdAt: moduleItem.created_at,
        updatedAt: moduleItem.updated_at,
      };
    });
  } catch (error) {
    throw new Error('Data gagal dimuat. Silakan coba lagi.', { cause: error });
  }
}

export async function getTeacherDashboardData(profile: Profile): Promise<TeacherDashboardData> {
  if (!isSupabaseConfigured) {
    return buildDemoDashboardData();
  }

  try {
    const supabase = await createClient();
    const source = await getTeacherSourceData(profile.id, profile.role);
    const classes = source.classes as ClassRow[];
    const modules = source.modules.filter((moduleItem) => moduleItem.status === 'published') as ModuleRow[];
    const announcements = source.announcements.slice(0, 4) as AnnouncementRow[];
    const moduleIds = modules.map((moduleItem) => moduleItem.id);
    const students = source.students as StudentRow[];
    const publishedModuleIds = new Set(moduleIds);
    const quizzes = (source.quizzes as QuizRow[]).filter((quiz) => publishedModuleIds.has(quiz.module_id));
    const studentIds = students.map((student) => student.id);
    const quizIds = quizzes.map((quiz) => quiz.id);

    const [moduleProgressResult, quizAttemptsResult, reflectionsResult] = await Promise.all([
      studentIds.length && moduleIds.length
        ? readAllRows(supabase
            .from('module_progress')
            .select('student_id, module_id, status, progress_percent, completed_at, updated_at, created_at')
            .in('student_id', studentIds)
            .in('module_id', moduleIds).order('id'))
        : Promise.resolve({ data: [], error: null }),
      studentIds.length && quizIds.length
        ? supabase
            .from('quiz_attempts')
            .select('id, quiz_id, student_id, score, submitted_at, created_at')
            .in('student_id', studentIds)
            .in('quiz_id', quizIds)
            .order('submitted_at', { ascending: false })
            .limit(10)
        : Promise.resolve({ data: [], error: null }),
      studentIds.length && moduleIds.length
        ? supabase
            .from('reflections')
            .select('id, student_id, module_id, created_at')
            .in('student_id', studentIds)
            .in('module_id', moduleIds)
            .order('created_at', { ascending: false })
            .limit(10)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (moduleProgressResult.error || quizAttemptsResult.error || reflectionsResult.error) throw moduleProgressResult.error ?? quizAttemptsResult.error ?? reflectionsResult.error;
    const progressRows = moduleProgressResult.error ? [] : ((moduleProgressResult.data ?? []) as ModuleProgressRow[]);
    const quizAttempts = quizAttemptsResult.error ? [] : ((quizAttemptsResult.data ?? []) as QuizAttemptRow[]);
    const reflections = reflectionsResult.error ? [] : ((reflectionsResult.data ?? []) as ReflectionRow[]);

    const studentById = new Map(students.map((student) => [student.id, student]));
    const quizById = new Map(quizzes.map((quiz) => [quiz.id, quiz]));
    const moduleById = new Map(modules.map((moduleItem) => [moduleItem.id, moduleItem]));
    const studentsByClass = groupBy(students, (student) => student.class_id ?? 'none');
    const teacherProgressGroupId = '__all_students__';
    const progressGroups = new Map(studentsByClass);
    progressGroups.set(teacherProgressGroupId, students);
    const classProgressById = calculateClassProgressByGroup(progressGroups, moduleIds, progressRows);
    const moduleCompletionItems = modules.slice(0, 6);
    const moduleCompletionById = calculateModuleAverageProgressForModules(
      moduleCompletionItems.map((moduleItem) => moduleItem.id),
      students,
      progressRows,
    );
    const completedCountByModule = new Map<string, number>();
    for (const progress of progressRows) {
      if (progress.status === 'completed' || progress.completed_at) {
        completedCountByModule.set(progress.module_id, (completedCountByModule.get(progress.module_id) ?? 0) + 1);
      }
    }

    return {
      classesCount: classes.length,
      studentsCount: students.length,
      quizzesCount: quizzes.length,
      completionRate: classProgressById.get(teacherProgressGroupId) ?? 0,
      classProgress: classes.map((classItem) => {
        const classStudents = studentsByClass.get(classItem.id) ?? [];

        return {
          id: classItem.id,
          name: classItem.name,
          studentsCount: classStudents.length,
          progress: classProgressById.get(classItem.id) ?? 0,
        };
      }),
      activities: buildActivities({
        quizAttempts,
        reflections,
        progressRows,
        studentById,
        quizById,
        moduleById,
      }),
      moduleCompletion: moduleCompletionItems.map((moduleItem) => {
        return {
          id: moduleItem.id,
          title: moduleItem.title,
          completionRate: moduleCompletionById.get(moduleItem.id) ?? 0,
          completedCount: completedCountByModule.get(moduleItem.id) ?? 0,
          studentsCount: students.length,
        };
      }),
      announcements: announcements.map((announcement) => ({
        id: announcement.id,
        title: announcement.title,
        content: announcement.content,
        priority: announcement.priority,
        publishedAt: announcement.published_at,
        createdAt: announcement.created_at,
      })),
      isDemo: false,
    };
  } catch (error) {
    throw new Error('Data gagal dimuat. Silakan coba lagi.', { cause: error });
  }
}

function buildActivities({
  quizAttempts,
  reflections,
  progressRows,
  studentById,
  quizById,
  moduleById,
}: {
  quizAttempts: QuizAttemptRow[];
  reflections: ReflectionRow[];
  progressRows: ModuleProgressRow[];
  studentById: Map<string, StudentRow>;
  quizById: Map<string, QuizRow>;
  moduleById: Map<string, ModuleRow>;
}) {
  const activities: TeacherActivity[] = [
    ...quizAttempts.map((attempt) => ({
      id: `quiz-${attempt.id}`,
      title: `${studentById.get(attempt.student_id)?.full_name ?? 'Siswa'} menyelesaikan kuis`,
      description: `${quizById.get(attempt.quiz_id)?.title ?? 'Kuis modul'} - skor ${Math.round(Number(attempt.score ?? 0))}`,
      date: attempt.submitted_at ?? attempt.created_at ?? new Date().toISOString(),
      type: 'quiz' as const,
    })),
    ...reflections.map((reflection) => ({
      id: `reflection-${reflection.id}`,
      title: `${studentById.get(reflection.student_id)?.full_name ?? 'Siswa'} mengirim refleksi`,
      description: moduleById.get(reflection.module_id)?.title ?? 'Modul pembelajaran',
      date: reflection.created_at,
      type: 'reflection' as const,
    })),
    ...progressRows
      .filter((progress) => progress.status === 'completed' || progress.completed_at)
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
    .slice(0, 8);
}

function buildDemoDashboardData(): TeacherDashboardData {
  return {
    classesCount: 8,
    studentsCount: 236,
    quizzesCount: 24,
    completionRate: 87,
    classProgress: [
      { id: 'demo-class-8a', name: 'Kelas X MA A', studentsCount: 32, progress: 92 },
      { id: 'demo-class-8b', name: 'Kelas X MA B', studentsCount: 30, progress: 78 },
      { id: 'demo-class-9a', name: 'Kelas X MA C', studentsCount: 29, progress: 85 },
      { id: 'demo-class-9b', name: 'Kelas X MA D', studentsCount: 31, progress: 65 },
    ],
    activities: [
      {
        id: 'demo-activity-1',
        title: 'Kelas X MA A menyelesaikan kuis',
        description: 'Akhlak dalam Islam - skor rata-rata 90',
        date: new Date().toISOString(),
        type: 'quiz',
      },
      {
        id: 'demo-activity-2',
        title: 'Siswa baru bergabung',
        description: 'Kelas X MA D',
        date: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        type: 'module',
      },
    ],
    moduleCompletion: [
      { id: 'demo-module-1', title: 'Adab dalam Islam', completionRate: 92, completedCount: 29, studentsCount: 32 },
      { id: 'demo-module-2', title: 'Tawazun', completionRate: 78, completedCount: 25, studentsCount: 32 },
      { id: 'demo-module-3', title: 'Akhlak', completionRate: 85, completedCount: 27, studentsCount: 32 },
    ],
    announcements: [
      {
        id: 'demo-announcement-1',
        title: 'Libur Kenaikan Kelas',
        content: 'Kegiatan belajar mengajar diliburkan pada tanggal 26 Mei.',
        priority: 'high',
        publishedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      },
    ],
    isDemo: true,
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


function formatDuration(totalMinutes: number) {
  if (totalMinutes < 60) return `${totalMinutes} menit`;

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes ? `${hours}j ${minutes}m` : `${hours}j`;
}
