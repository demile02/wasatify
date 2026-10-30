import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import type { Profile } from '@/lib/types';

export type TeacherAnnouncementStatus = 'draft' | 'published';

export type TeacherAnnouncementClass = {
  id: string;
  name: string;
};

export type TeacherAnnouncementItem = {
  id: string;
  title: string;
  content: string;
  status: TeacherAnnouncementStatus;
  classId: string | null;
  className: string;
  publishedAt: string | null;
  createdAt: string;
};

export type TeacherAnnouncementsData = {
  classes: TeacherAnnouncementClass[];
  announcements: TeacherAnnouncementItem[];
  summary: {
    total: number;
    published: number;
    draft: number;
    thisWeek: number;
  };
};

type ClassRow = {
  id: string;
  name: string;
};

type AnnouncementRow = {
  id: string;
  title: string;
  content: string;
  status: TeacherAnnouncementStatus | null;
  class_id: string | null;
  published_at: string | null;
  created_at: string;
};

export async function getTeacherAnnouncementsData(profile: Profile): Promise<TeacherAnnouncementsData> {
  if (!isSupabaseConfigured) return emptyAnnouncementsData();

  try {
    const supabase = await createClient();
    let classQuery = supabase.from('classes').select('id, name').order('name', { ascending: true });
    let announcementQuery = supabase
      .from('announcements')
      .select('id, title, content, status, class_id, published_at, created_at')
      .order('created_at', { ascending: false });

    if (profile.role !== 'admin') {
      classQuery = classQuery.eq('teacher_id', profile.id);
      announcementQuery = announcementQuery.eq('teacher_id', profile.id);
    }

    const [classesResult, announcementsResult] = await Promise.all([classQuery, announcementQuery]);
    if (classesResult.error || announcementsResult.error) {
      throw classesResult.error ?? announcementsResult.error;
    }

    const classes = (classesResult.data ?? []) as ClassRow[];
    const classById = new Map(classes.map((classItem) => [classItem.id, classItem]));
    const announcements = ((announcementsResult.data ?? []) as AnnouncementRow[]).map((announcement) => ({
      id: announcement.id,
      title: announcement.title,
      content: announcement.content,
      status: announcement.status ?? (announcement.published_at ? 'published' : 'draft'),
      classId: announcement.class_id,
      className: announcement.class_id ? classById.get(announcement.class_id)?.name ?? 'Kelas lain' : 'Semua Kelas',
      publishedAt: announcement.published_at,
      createdAt: announcement.created_at,
    }));
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    return {
      classes,
      announcements,
      summary: {
        total: announcements.length,
        published: announcements.filter((item) => item.status === 'published').length,
        draft: announcements.filter((item) => item.status === 'draft').length,
        thisWeek: announcements.filter((item) => new Date(item.createdAt).getTime() >= oneWeekAgo).length,
      },
    };
  } catch {
    return emptyAnnouncementsData();
  }
}

function emptyAnnouncementsData(): TeacherAnnouncementsData {
  return {
    classes: [],
    announcements: [],
    summary: {
      total: 0,
      published: 0,
      draft: 0,
      thisWeek: 0,
    },
  };
}
