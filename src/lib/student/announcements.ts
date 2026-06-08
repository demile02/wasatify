import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import type { Profile } from '@/lib/types';

export type StudentAnnouncementItem = {
  id: string;
  notificationKey: string;
  title: string;
  content: string;
  publishedAt: string;
  readAt: string | null;
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

export async function getStudentAnnouncementsData(profile: Profile): Promise<StudentAnnouncementItem[]> {
  if (!isSupabaseConfigured) return [];

  try {
    const supabase = await createClient();
    let query = supabase
      .from('announcements')
      .select('id, title, content, published_at, created_at')
      .eq('status', 'published')
      .not('published_at', 'is', null)
      .lte('published_at', new Date().toISOString())
      .order('published_at', { ascending: false });

    query = profile.class_id ? query.or(`class_id.is.null,class_id.eq.${profile.class_id}`) : query.is('class_id', null);

    const { data, error } = await query;
    if (error) throw error;

    const announcements = ((data ?? []) as AnnouncementRow[]).map((announcement) => ({
      id: announcement.id,
      notificationKey: `announcement:${announcement.id}`,
      title: announcement.title,
      content: announcement.content,
      publishedAt: announcement.published_at ?? announcement.created_at,
      readAt: null,
    }));

    if (!announcements.length) return announcements;

    const { data: reads } = await supabase
      .from('notification_reads')
      .select('notification_key, read_at')
      .eq('user_id', profile.id)
      .in(
        'notification_key',
        announcements.map((announcement) => announcement.notificationKey),
      );

    const readByKey = new Map(((reads ?? []) as NotificationReadRow[]).map((read) => [read.notification_key, read.read_at]));

    return announcements.map((announcement) => ({
      ...announcement,
      readAt: readByKey.get(announcement.notificationKey) ?? null,
    }));
  } catch {
    return [];
  }
}
