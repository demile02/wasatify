import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import type { Profile } from '@/lib/types';

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  href: string;
  kind: 'announcement';
};

type AnnouncementRow = {
  id: string;
  title: string;
  content: string;
  published_at: string | null;
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

    return ((data ?? []) as AnnouncementRow[]).map((announcement) => ({
      id: announcement.id,
      title: announcement.title,
      body: announcement.content,
      createdAt: announcement.published_at ?? announcement.created_at,
      href: '/student/dashboard',
      kind: 'announcement',
    }));
  } catch {
    return [];
  }
}

export async function getTeacherNotifications(profile: Profile): Promise<NotificationItem[]> {
  if (!isSupabaseConfigured) return [];

  try {
    const supabase = await createClient();
    let query = supabase
      .from('announcements')
      .select('id, title, content, published_at, created_at')
      .order('created_at', { ascending: false })
      .limit(8);

    if (profile.role !== 'admin') {
      query = query.eq('teacher_id', profile.id);
    }

    const { data, error } = await query;
    if (error) throw error;

    return ((data ?? []) as AnnouncementRow[]).map((announcement) => ({
      id: announcement.id,
      title: announcement.title,
      body: announcement.content,
      createdAt: announcement.published_at ?? announcement.created_at,
      href: '/teacher/announcements',
      kind: 'announcement',
    }));
  } catch {
    return [];
  }
}
