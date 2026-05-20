import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import type { Profile } from '@/lib/types';

export type NotificationItem = {
  id: string;
  notificationKey: string;
  title: string;
  body: string;
  createdAt: string;
  href: string;
  kind: 'announcement' | 'reflection' | 'quiz_attempt' | 'module_progress';
  readAt?: string | null;
};

type AnnouncementRow = {
  id: string;
  title: string;
  content: string;
  published_at: string | null;
  created_at: string;
};

type NotificationReadRow = {
  notification_key: string;
  read_at: string;
};

type ClassRow = {
  id: string;
};

type StudentRow = {
  id: string;
  full_name: string;
};

type ModuleRow = {
  id: string;
  title: string;
};

type QuizRow = {
  id: string;
  title: string;
  module_id: string;
};

type ReflectionRow = {
  id: string;
  student_id: string;
  module_id: string;
  created_at: string;
};

type QuizAttemptRow = {
  id: string;
  student_id: string;
  quiz_id: string;
  score: number | null;
  submitted_at: string | null;
  created_at: string;
};

type ModuleProgressRow = {
  id: string;
  student_id: string;
  module_id: string;
  status: string | null;
  progress_percent: number | null;
  completed_at: string | null;
  updated_at: string | null;
  created_at: string;
};

export async function getStudentNotifications(profile: Profile): Promise<NotificationItem[]> {
  if (!isSupabaseConfigured) return [];

  try {
    const supabase = await createClient();
    let query = supabase
      .from('announcements')
      .select('id, title, content, published_at, created_at')
      .eq('status', 'published')
      .not('published_at', 'is', null)
      .lte('published_at', new Date().toISOString())
      .order('published_at', { ascending: false })
      .limit(8);

    query = profile.class_id ? query.or(`class_id.is.null,class_id.eq.${profile.class_id}`) : query.is('class_id', null);

    const { data, error } = await query;
    if (error) throw error;

    const notifications: NotificationItem[] = ((data ?? []) as AnnouncementRow[]).map((announcement) => ({
      id: announcement.id,
      notificationKey: `announcement:${announcement.id}`,
      title: announcement.title,
      body: announcement.content,
      createdAt: announcement.published_at ?? announcement.created_at,
      href: '/student/dashboard',
      kind: 'announcement',
    }));

    return withReadState(profile.id, notifications);
  } catch {
    return [];
  }
}

export async function getTeacherNotifications(profile: Profile): Promise<NotificationItem[]> {
  if (!isSupabaseConfigured) return [];

  try {
    const supabase = await createClient();
    const announcementQuery = supabase
      .from('announcements')
      .select('id, title, content, published_at, created_at')
      .order('created_at', { ascending: false })
      .limit(8);

    const scopedAnnouncementQuery = profile.role === 'admin' ? announcementQuery : announcementQuery.eq('teacher_id', profile.id);
    const [announcementsResult, activityNotifications] = await Promise.all([
      scopedAnnouncementQuery,
      getTeacherStudentActivityNotifications(profile),
    ]);

    const { data, error } = announcementsResult;
    if (error) throw error;

    const announcementNotifications: NotificationItem[] = ((data ?? []) as AnnouncementRow[]).map((announcement) => ({
      id: announcement.id,
      notificationKey: `announcement:${announcement.id}`,
      title: announcement.title,
      body: announcement.content,
      createdAt: announcement.published_at ?? announcement.created_at,
      href: '/teacher/announcements',
      kind: 'announcement',
    }));

    const notifications = [...activityNotifications, ...announcementNotifications]
      .sort((first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime())
      .slice(0, 16);

    return withReadState(profile.id, notifications);
  } catch {
    return [];
  }
}

async function getTeacherStudentActivityNotifications(profile: Profile): Promise<NotificationItem[]> {
  if (profile.role === 'admin') return [];

  const supabase = await createClient();
  const [classesResult, modulesResult] = await Promise.all([
    supabase.from('classes').select('id').eq('teacher_id', profile.id),
    supabase.from('modules').select('id, title').eq('created_by', profile.id),
  ]);

  if (classesResult.error || modulesResult.error) {
    throw classesResult.error ?? modulesResult.error;
  }

  const classIds = ((classesResult.data ?? []) as ClassRow[]).map((classItem) => classItem.id);
  const modules = (modulesResult.data ?? []) as ModuleRow[];
  const moduleIds = modules.map((moduleItem) => moduleItem.id);

  if (!classIds.length || !moduleIds.length) return [];

  const studentsResult = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('role', 'student')
    .in('class_id', classIds);

  if (studentsResult.error) throw studentsResult.error;

  const students = (studentsResult.data ?? []) as StudentRow[];
  const studentIds = students.map((student) => student.id);
  if (!studentIds.length) return [];

  const quizzesResult = await supabase.from('quizzes').select('id, title, module_id').in('module_id', moduleIds);
  if (quizzesResult.error) throw quizzesResult.error;

  const quizzes = (quizzesResult.data ?? []) as QuizRow[];
  const quizIds = quizzes.map((quiz) => quiz.id);

  const [reflectionsResult, attemptsResult, progressResult] = await Promise.all([
    supabase
      .from('reflections')
      .select('id, student_id, module_id, created_at')
      .in('student_id', studentIds)
      .in('module_id', moduleIds)
      .order('created_at', { ascending: false })
      .limit(8),
    quizIds.length
      ? supabase
          .from('quiz_attempts')
          .select('id, student_id, quiz_id, score, submitted_at, created_at')
          .in('student_id', studentIds)
          .in('quiz_id', quizIds)
          .order('submitted_at', { ascending: false, nullsFirst: false })
          .order('created_at', { ascending: false })
          .limit(8)
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from('module_progress')
      .select('id, student_id, module_id, status, progress_percent, completed_at, updated_at, created_at')
      .in('student_id', studentIds)
      .in('module_id', moduleIds)
      .or('status.eq.completed,progress_percent.eq.100,completed_at.not.is.null')
      .order('completed_at', { ascending: false, nullsFirst: false })
      .order('updated_at', { ascending: false })
      .limit(8),
  ]);

  if (reflectionsResult.error || attemptsResult.error || progressResult.error) {
    throw reflectionsResult.error ?? attemptsResult.error ?? progressResult.error;
  }

  const studentById = new Map(students.map((student) => [student.id, student]));
  const moduleById = new Map(modules.map((moduleItem) => [moduleItem.id, moduleItem]));
  const quizById = new Map(quizzes.map((quiz) => [quiz.id, quiz]));
  const notifications: NotificationItem[] = [];

  for (const reflection of (reflectionsResult.data ?? []) as ReflectionRow[]) {
    const student = studentById.get(reflection.student_id);
    const moduleItem = moduleById.get(reflection.module_id);
    notifications.push({
      id: reflection.id,
      notificationKey: `reflection:${reflection.id}`,
      title: `${student?.full_name ?? 'Siswa'} mengumpulkan refleksi`,
      body: moduleItem ? `Refleksi untuk modul ${moduleItem.title} sudah dikirim.` : 'Refleksi siswa sudah dikirim.',
      createdAt: reflection.created_at,
      href: '/teacher/reflections',
      kind: 'reflection',
    });
  }

  for (const attempt of (attemptsResult.data ?? []) as QuizAttemptRow[]) {
    const student = studentById.get(attempt.student_id);
    const quiz = quizById.get(attempt.quiz_id);
    notifications.push({
      id: attempt.id,
      notificationKey: `quiz_attempt:${attempt.id}`,
      title: `${student?.full_name ?? 'Siswa'} mengerjakan kuis`,
      body: `${quiz?.title ?? 'Kuis'}${typeof attempt.score === 'number' ? ` - skor ${attempt.score}` : ''}`,
      createdAt: attempt.submitted_at ?? attempt.created_at,
      href: '/teacher/reports',
      kind: 'quiz_attempt',
    });
  }

  for (const progress of (progressResult.data ?? []) as ModuleProgressRow[]) {
    const student = studentById.get(progress.student_id);
    const moduleItem = moduleById.get(progress.module_id);
    notifications.push({
      id: progress.id,
      notificationKey: `module_progress:${progress.id}`,
      title: `${student?.full_name ?? 'Siswa'} menyelesaikan modul`,
      body: moduleItem ? `Modul ${moduleItem.title} sudah selesai.` : 'Satu modul sudah selesai.',
      createdAt: progress.completed_at ?? progress.updated_at ?? progress.created_at,
      href: '/teacher/classes',
      kind: 'module_progress',
    });
  }

  return notifications;
}

async function withReadState(userId: string, notifications: NotificationItem[]) {
  if (!notifications.length) return notifications;

  const supabase = await createClient();
  const keys = notifications.map((notification) => notification.notificationKey);
  const { data, error } = await supabase
    .from('notification_reads')
    .select('notification_key, read_at')
    .eq('user_id', userId)
    .in('notification_key', keys);

  if (error) return notifications;

  const readAtByKey = new Map(((data ?? []) as NotificationReadRow[]).map((row) => [row.notification_key, row.read_at]));

  return notifications.map((notification) => ({
    ...notification,
    readAt: readAtByKey.get(notification.notificationKey) ?? null,
  }));
}
