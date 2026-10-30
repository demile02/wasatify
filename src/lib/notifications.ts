import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import type { Profile } from '@/lib/types';

export type NotificationItem = {
  id: string;
  notificationKey: string;
  title: string;
  body: string;
  createdAt: string;
  href: string;
  kind: 'announcement' | 'reflection' | 'quiz_attempt' | 'module_progress' | 'message';
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

type MessageRow = {
  id: string;
  sender_id: string | null;
  recipient_id: string | null;
  target_class_id: string | null;
  title: string;
  body: string;
  created_at: string;
};

export async function getStudentNotifications(profile: Profile): Promise<NotificationItem[]> {
  if (!isSupabaseConfigured) return [];

  try {
    const [announcementNotifications, messageNotifications] = await Promise.all([
      getStudentAnnouncementNotifications(profile),
      getStudentMessageNotifications(profile),
    ]);

    const notifications = [...announcementNotifications, ...messageNotifications]
      .sort((first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime())
      .slice(0, 16);

    return withReadState(profile.id, notifications);
  } catch {
    return [];
  }
}

async function getStudentAnnouncementNotifications(profile: Profile): Promise<NotificationItem[]> {
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
      notificationKey: `announcement:${announcement.id}`,
      title: announcement.title,
      body: announcement.content,
      createdAt: announcement.published_at ?? announcement.created_at,
      href: '/student/announcements',
      kind: 'announcement',
    }));
  } catch {
    return [];
  }
}

async function getStudentMessageNotifications(profile: Profile): Promise<NotificationItem[]> {
  try {
    const supabase = await createClient();
    let query = supabase
      .from('messages')
      .select('id, sender_id, recipient_id, target_class_id, title, body, created_at')
      .order('created_at', { ascending: false })
      .limit(8);

    const scopes = [`recipient_id.eq.${profile.id}`, 'and(recipient_id.is.null,target_class_id.is.null)'];
    if (profile.class_id) scopes.push(`target_class_id.eq.${profile.class_id}`);
    query = query.or(scopes.join(','));

    const { data, error } = await query;
    if (error) throw error;

    return ((data ?? []) as MessageRow[]).map((message) => ({
      id: message.id,
      notificationKey: `message:${message.id}`,
      title: message.title,
      body: message.body,
      createdAt: message.created_at,
      href: '/student/messages',
      kind: 'message',
    }));
  } catch {
    return [];
  }
}

export async function getTeacherNotifications(profile: Profile): Promise<NotificationItem[]> {
  if (!isSupabaseConfigured || !['teacher', 'admin'].includes(profile.role)) return [];
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('get_teacher_notification_feed');
    if (error) throw error;
    return (data ?? []) as NotificationItem[];
  } catch {
    return [];
  }
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
