import { readAllRows } from '@/lib/supabase/read-all-rows';
import { cache } from 'react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import type { AppRole } from '@/lib/types';

export type TeacherSourceClass = {
  id: string;
  name: string;
  grade_level: string | null;
};

export type TeacherSourceStudent = {
  id: string;
  full_name: string;
  class_id: string | null;
};

export type TeacherSourceModule = {
  id: string;
  slug: string;
  title: string;
  description: string;
  class_id: string | null;
  cover_image_path: string | null;
  tags: string[] | null;
  status: 'published' | 'draft' | 'archived';
  estimated_minutes: number | null;
  created_at: string | null;
  updated_at: string | null;
};

export type TeacherSourceQuiz = {
  id: string;
  title: string;
  module_id: string;
  created_at: string;
};

export type TeacherSourceAnnouncement = {
  id: string;
  title: string;
  content: string;
  priority: 'low' | 'normal' | 'high';
  published_at: string | null;
  created_at: string;
};

export type TeacherSourceData = {
  classes: TeacherSourceClass[];
  modules: TeacherSourceModule[];
  students: TeacherSourceStudent[];
  quizzes: TeacherSourceQuiz[];
  announcements: TeacherSourceAnnouncement[];
};

export const getTeacherSourceData = cache(async (teacherId: string, role: AppRole): Promise<TeacherSourceData> => {
  if (!isSupabaseConfigured) {
    return { classes: [], modules: [], students: [], quizzes: [], announcements: [] };
  }

  const supabase = await createClient();
  let classesQuery = supabase
    .from('classes')
    .select('id, name, grade_level')
    .order('created_at', { ascending: false });
  let modulesQuery = supabase
    .from('modules')
    .select('id, slug, title, description, class_id, cover_image_path, tags, status, estimated_minutes, created_at, updated_at')
    .order('updated_at', { ascending: false });
  let announcementsQuery = supabase
    .from('announcements')
    .select('id, title, content, priority, published_at, created_at')
    .order('created_at', { ascending: false })
    .limit(8);

  if (role === 'teacher') {
    classesQuery = classesQuery.eq('teacher_id', teacherId);
    modulesQuery = modulesQuery.eq('created_by', teacherId);
    announcementsQuery = announcementsQuery.eq('teacher_id', teacherId);
  }

  const [classesResult, modulesResult, announcementsResult] = await Promise.all([
    readAllRows(classesQuery.order('id')),
    readAllRows(modulesQuery.order('id')),
    announcementsQuery,
  ]);

  if (classesResult.error || modulesResult.error || announcementsResult.error) {
    throw classesResult.error ?? modulesResult.error ?? announcementsResult.error;
  }

  const classes = (classesResult.data ?? []) as TeacherSourceClass[];
  const modules = (modulesResult.data ?? []) as TeacherSourceModule[];
  const classIds = classes.map((classItem) => classItem.id);
  const moduleIds = modules.map((moduleItem) => moduleItem.id);
  const [studentsResult, quizzesResult] = await Promise.all([
    classIds.length
      ? readAllRows(supabase.from('profiles').select('id, full_name, class_id').eq('role', 'student').in('class_id', classIds).order('id'))
      : Promise.resolve({ data: [], error: null }),
    moduleIds.length
      ? readAllRows(supabase.from('quizzes').select('id, title, module_id, created_at').in('module_id', moduleIds).order('id'))
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (studentsResult.error || quizzesResult.error) throw studentsResult.error ?? quizzesResult.error;

  return {
    classes,
    modules,
    students: studentsResult.error ? [] : ((studentsResult.data ?? []) as TeacherSourceStudent[]),
    quizzes: quizzesResult.error ? [] : ((quizzesResult.data ?? []) as TeacherSourceQuiz[]),
    announcements: (announcementsResult.data ?? []) as TeacherSourceAnnouncement[],
  };
});
