import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import type { Profile } from '@/lib/types';

export type StudentClassTeacherContext = {
  profile: Pick<Profile, 'id' | 'class_id'> | null;
  classId: string | null;
  teacherId: string | null;
};

type ProfileClassRow = {
  id: string;
  class_id: string | null;
};

type ClassTeacherRow = {
  id: string;
  teacher_id: string | null;
};

type ModuleIdRow = {
  id: string;
};

type StudentIdRow = {
  id: string;
};

export async function getStudentClassTeacherContext(studentId: string): Promise<StudentClassTeacherContext> {
  if (!isSupabaseConfigured) {
    return { profile: null, classId: null, teacherId: null };
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, class_id')
    .eq('id', studentId)
    .maybeSingle<ProfileClassRow>();

  if (!profile?.class_id) {
    return { profile: profile ?? null, classId: profile?.class_id ?? null, teacherId: null };
  }

  const { data: classRow } = await supabase
    .from('classes')
    .select('id, teacher_id')
    .eq('id', profile.class_id)
    .maybeSingle<ClassTeacherRow>();

  return {
    profile,
    classId: profile.class_id,
    teacherId: classRow?.teacher_id ?? null,
  };
}

export async function getStudentAvailableModuleIds(studentId: string) {
  const context = await getStudentClassTeacherContext(studentId);
  if (!context.teacherId) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('modules')
    .select('id')
    .eq('status', 'published')
    .eq('created_by', context.teacherId)
    .order('order_index', { ascending: true });

  if (error) return [];
  return ((data ?? []) as ModuleIdRow[]).map((moduleItem) => moduleItem.id);
}

export async function getTeacherScopedModuleIds(teacherId: string, options: { publishedOnly?: boolean } = {}) {
  if (!isSupabaseConfigured) return [];

  const supabase = await createClient();
  let query = supabase.from('modules').select('id').eq('created_by', teacherId);

  if (options.publishedOnly ?? true) {
    query = query.eq('status', 'published');
  }

  const { data, error } = await query;
  if (error) return [];
  return ((data ?? []) as ModuleIdRow[]).map((moduleItem) => moduleItem.id);
}

export async function getTeacherClassStudentIds(teacherId: string) {
  if (!isSupabaseConfigured) return [];

  const supabase = await createClient();
  const { data: classRows, error: classError } = await supabase.from('classes').select('id').eq('teacher_id', teacherId);
  if (classError) return [];

  const classIds = ((classRows ?? []) as { id: string }[]).map((classItem) => classItem.id);
  if (!classIds.length) return [];

  const { data: studentRows, error: studentError } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'student')
    .in('class_id', classIds);

  if (studentError) return [];
  return ((studentRows ?? []) as StudentIdRow[]).map((student) => student.id);
}
