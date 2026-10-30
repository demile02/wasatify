import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { readAllRows } from '@/lib/supabase/read-all-rows';
import type { Profile } from '@/lib/types';

const messagesPerPage = 20;

export type TeacherMessageClass = {
  id: string;
  name: string;
};

export type TeacherMessageItem = {
  id: string;
  title: string;
  body: string;
  targetName: string;
  createdAt: string;
};

export type TeacherMessagesData = {
  classes: TeacherMessageClass[];
  messages: TeacherMessageItem[];
  page: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

type ClassRow = TeacherMessageClass;
type MessageRow = {
  id: string;
  title: string;
  body: string;
  target_class_id: string | null;
  recipient_id: string | null;
  created_at: string;
};

type RecipientRow = {
  id: string;
  full_name: string;
};

export async function getTeacherMessagesData(profile: Profile, requestedPage = 1): Promise<TeacherMessagesData> {
  const page = Number.isSafeInteger(requestedPage) ? Math.max(1, requestedPage) : 1;
  const emptyData = { classes: [], messages: [], page, hasNextPage: false, hasPreviousPage: page > 1 };
  if (!isSupabaseConfigured) return emptyData;

  try {
    const supabase = await createClient();
    let classQuery = supabase.from('classes').select('id, name').order('name', { ascending: true });
    if (profile.role === 'teacher') classQuery = classQuery.eq('teacher_id', profile.id);

    const start = (page - 1) * messagesPerPage;
    const [classesResult, messagesResult] = await Promise.all([
      readAllRows(classQuery),
      supabase
        .from('messages')
        .select('id, title, body, target_class_id, recipient_id, created_at')
        .eq('sender_id', profile.id)
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .range(start, start + messagesPerPage),
    ]);

    if (messagesResult.error) throw messagesResult.error;
    const classes = classesResult.data as ClassRow[];
    const rows = (messagesResult.data ?? []) as MessageRow[];
    const hasNextPage = rows.length > messagesPerPage;
    const visibleRows = rows.slice(0, messagesPerPage);
    const recipientIds = Array.from(new Set(visibleRows.map((row) => row.recipient_id).filter(Boolean))) as string[];
    const recipientResult = recipientIds.length
      ? await supabase.from('profiles').select('id, full_name').in('id', recipientIds)
      : { data: [], error: null };
    if (recipientResult.error) throw recipientResult.error;

    const classNames = new Map(classes.map((classItem) => [classItem.id, classItem.name]));
    const recipientNames = new Map(((recipientResult.data ?? []) as RecipientRow[]).map((recipient) => [recipient.id, recipient.full_name]));

    return {
      classes,
      messages: visibleRows.map((row) => ({
        id: row.id,
        title: row.title,
        body: row.body,
        targetName: row.target_class_id
          ? classNames.get(row.target_class_id) ?? 'Kelas'
          : row.recipient_id
            ? recipientNames.get(row.recipient_id) ?? 'Siswa'
            : 'Semua siswa',
        createdAt: row.created_at,
      })),
      page,
      hasNextPage,
      hasPreviousPage: page > 1,
    };
  } catch (error) {
    throw new Error('Pesan gagal dimuat. Silakan coba lagi.', { cause: error });
  }
}
