import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import type { Profile } from '@/lib/types';

export type TeacherReflectionItem = {
  id: string;
  studentId: string;
  studentName: string;
  classId: string | null;
  className: string;
  moduleId: string;
  moduleTitle: string;
  reflectionText: string;
  actionPlan: string | null;
  teacherNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
};

export type TeacherReflectionFilterOption = {
  id: string;
  label: string;
};

export type TeacherReflectionsData = {
  reflections: TeacherReflectionItem[];
  classes: TeacherReflectionFilterOption[];
  modules: TeacherReflectionFilterOption[];
  summary: {
    total: number;
    pending: number;
    reviewed: number;
    thisWeek: number;
  };
};

type ClassRow = {
  id: string;
  name: string;
};

type StudentRow = {
  id: string;
  full_name: string;
  class_id: string | null;
};

type ModuleRow = {
  id: string;
  title: string;
};

type ReflectionRow = {
  id: string;
  student_id: string;
  module_id: string;
  reflection_text: string;
  action_plan: string | null;
  teacher_note: string | null;
  reviewed_at: string | null;
  created_at: string;
};

export async function getTeacherReflectionsData(profile: Profile): Promise<TeacherReflectionsData> {
  if (!isSupabaseConfigured) {
    return emptyTeacherReflectionsData();
  }

  try {
    const supabase = await createClient();
    let classQuery = supabase.from('classes').select('id, name').order('name', { ascending: true });
    if (profile.role === 'teacher') classQuery = classQuery.eq('teacher_id', profile.id);

    const { data: classRows, error: classError } = await classQuery;
    if (classError) throw classError;

    const classes = (classRows ?? []) as ClassRow[];
    const classIds = classes.map((classItem) => classItem.id);
    const { data: studentRows, error: studentError } = classIds.length
      ? await supabase
          .from('profiles')
          .select('id, full_name, class_id')
          .eq('role', 'student')
          .in('class_id', classIds)
      : { data: [], error: null };

    if (studentError) throw studentError;

    const students = (studentRows ?? []) as StudentRow[];
    const studentIds = students.map((student) => student.id);
    const { data: reflectionRows, error: reflectionError } = studentIds.length
      ? await supabase
          .from('reflections')
          .select('id, student_id, module_id, reflection_text, action_plan, teacher_note, reviewed_at, created_at')
          .in('student_id', studentIds)
          .order('created_at', { ascending: false })
      : { data: [], error: null };

    if (reflectionError) throw reflectionError;

    const reflections = (reflectionRows ?? []) as ReflectionRow[];
    const moduleIds = [...new Set(reflections.map((reflection) => reflection.module_id))];
    const { data: moduleRows } = moduleIds.length
      ? await supabase.from('modules').select('id, title').in('id', moduleIds)
      : { data: [] };

    const classById = new Map(classes.map((classItem) => [classItem.id, classItem]));
    const studentById = new Map(students.map((student) => [student.id, student]));
    const moduleById = new Map(((moduleRows ?? []) as ModuleRow[]).map((moduleItem) => [moduleItem.id, moduleItem]));
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const items = reflections.map((reflection) => {
      const student = studentById.get(reflection.student_id);
      const classItem = student?.class_id ? classById.get(student.class_id) : null;
      const moduleItem = moduleById.get(reflection.module_id);

      return {
        id: reflection.id,
        studentId: reflection.student_id,
        studentName: student?.full_name ?? 'Siswa',
        classId: student?.class_id ?? null,
        className: classItem?.name ?? 'Tanpa kelas',
        moduleId: reflection.module_id,
        moduleTitle: moduleItem?.title ?? 'Modul',
        reflectionText: reflection.reflection_text,
        actionPlan: reflection.action_plan,
        teacherNote: reflection.teacher_note,
        reviewedAt: reflection.reviewed_at,
        createdAt: reflection.created_at,
      };
    });

    return {
      reflections: items,
      classes: classes.map((classItem) => ({ id: classItem.id, label: classItem.name })),
      modules: [...moduleById.values()].map((moduleItem) => ({ id: moduleItem.id, label: moduleItem.title })),
      summary: {
        total: items.length,
        pending: items.filter((item) => !item.reviewedAt).length,
        reviewed: items.filter((item) => item.reviewedAt).length,
        thisWeek: items.filter((item) => new Date(item.createdAt).getTime() >= oneWeekAgo).length,
      },
    };
  } catch {
    return emptyTeacherReflectionsData();
  }
}

function emptyTeacherReflectionsData(): TeacherReflectionsData {
  return {
    reflections: [],
    classes: [],
    modules: [],
    summary: {
      total: 0,
      pending: 0,
      reviewed: 0,
      thisWeek: 0,
    },
  };
}
