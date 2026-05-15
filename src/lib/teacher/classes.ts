import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import type { Profile } from '@/lib/types';

export type TeacherClassListItem = {
  id: string;
  name: string;
  description: string | null;
  gradeLevel: string | null;
  academicYear: string | null;
  joinCode: string;
  totalStudents: number;
  activeStudents: number;
  averageProgress: number;
  averageQuizScore: number;
};

type ClassRow = {
  id: string;
  name: string;
  description: string | null;
  grade_level: string | null;
  academic_year: string | null;
  join_code: string;
};

type StudentRow = {
  id: string;
  class_id: string | null;
  last_active_at: string | null;
};

type ProgressRow = {
  student_id: string;
  progress_percent: number | null;
};

type QuizAttemptRow = {
  student_id: string;
  score: number | null;
};

export async function getTeacherClasses(profile: Profile): Promise<TeacherClassListItem[]> {
  if (!isSupabaseConfigured) return [];

  try {
    const supabase = await createClient();
    let classQuery = supabase
      .from('classes')
      .select('id, name, description, grade_level, academic_year, join_code')
      .order('created_at', { ascending: false });

    if (profile.role === 'teacher') {
      classQuery = classQuery.eq('teacher_id', profile.id);
    }

    const { data: classRows, error: classError } = await classQuery;
    if (classError) throw classError;

    const classes = (classRows ?? []) as ClassRow[];
    if (!classes.length) return [];

    const classIds = classes.map((classItem) => classItem.id);
    const { data: studentRows, error: studentError } = await supabase
      .from('profiles')
      .select('id, class_id, last_active_at')
      .eq('role', 'student')
      .in('class_id', classIds);

    if (studentError) throw studentError;

    const students = (studentRows ?? []) as StudentRow[];
    const studentIds = students.map((student) => student.id);
    const [progressResult, attemptsResult] = await Promise.all([
      studentIds.length
        ? supabase.from('module_progress').select('student_id, progress_percent').in('student_id', studentIds)
        : Promise.resolve({ data: [], error: null }),
      studentIds.length
        ? supabase.from('quiz_attempts').select('student_id, score').in('student_id', studentIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    const progressRows = progressResult.error ? [] : ((progressResult.data ?? []) as ProgressRow[]);
    const attempts = attemptsResult.error ? [] : ((attemptsResult.data ?? []) as QuizAttemptRow[]);
    const studentsByClass = groupBy(students, (student) => student.class_id ?? 'none');
    const progressByStudent = groupBy(progressRows, (progress) => progress.student_id);
    const attemptsByStudent = groupBy(attempts, (attempt) => attempt.student_id);
    const activeSince = Date.now() - 30 * 24 * 60 * 60 * 1000;

    return classes.map((classItem) => {
      const classStudents = studentsByClass.get(classItem.id) ?? [];
      const classProgressRows = classStudents.flatMap((student) => progressByStudent.get(student.id) ?? []);
      const classAttempts = classStudents.flatMap((student) => attemptsByStudent.get(student.id) ?? []);
      const scoredAttempts = classAttempts.filter((attempt) => typeof attempt.score === 'number');

      return {
        id: classItem.id,
        name: classItem.name,
        description: classItem.description,
        gradeLevel: classItem.grade_level,
        academicYear: classItem.academic_year,
        joinCode: classItem.join_code,
        totalStudents: classStudents.length,
        activeStudents: classStudents.filter((student) => {
          if (!student.last_active_at) return false;
          return new Date(student.last_active_at).getTime() >= activeSince;
        }).length,
        averageProgress: classProgressRows.length
          ? Math.round(
              classProgressRows.reduce((total, progress) => total + clamp(progress.progress_percent ?? 0), 0) /
                classProgressRows.length,
            )
          : 0,
        averageQuizScore: scoredAttempts.length
          ? Math.round(scoredAttempts.reduce((total, attempt) => total + Number(attempt.score ?? 0), 0) / scoredAttempts.length)
          : 0,
      };
    });
  } catch {
    return [];
  }
}

export async function getTeacherClassIds(teacherId: string) {
  if (!isSupabaseConfigured) return [];

  const supabase = await createClient();
  const { data, error } = await supabase.from('classes').select('id').eq('teacher_id', teacherId);

  if (error) return [];
  return (data ?? []).map((classItem) => classItem.id as string);
}

export async function getTeacherStudents(teacherId: string) {
  if (!isSupabaseConfigured) return [];

  const supabase = await createClient();
  const classIds = await getTeacherClassIds(teacherId);
  if (!classIds.length) return [];

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, class_id, last_active_at')
    .eq('role', 'student')
    .in('class_id', classIds);

  return error ? [] : data ?? [];
}

export async function getTeacherStudentProgress(teacherId: string) {
  if (!isSupabaseConfigured) return [];

  const supabase = await createClient();
  const students = await getTeacherStudents(teacherId);
  const studentIds = students.map((student) => student.id as string);
  if (!studentIds.length) return [];

  const { data, error } = await supabase
    .from('module_progress')
    .select('student_id, module_id, status, progress_percent, completed_at, updated_at')
    .in('student_id', studentIds);

  return error ? [] : data ?? [];
}

function groupBy<T>(items: T[], keyFn: (item: T) => string) {
  const groups = new Map<string, T[]>();

  for (const item of items) {
    const key = keyFn(item);
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }

  return groups;
}

function clamp(value: number) {
  return Math.min(Math.max(Math.round(value), 0), 100);
}
