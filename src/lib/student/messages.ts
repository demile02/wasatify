import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import type { Profile } from '@/lib/types';

export type StudentMessageItem = {
  id: string;
  senderName: string;
  title: string;
  body: string;
  createdAt: string;
  readAt: string | null;
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

type MessageReadRow = {
  message_id: string;
  read_at: string;
};

type ProfileNameRow = {
  id: string;
  full_name: string;
};

export async function getStudentMessagesData(profile: Profile): Promise<StudentMessageItem[]> {
  if (!isSupabaseConfigured) return [];

  try {
    const supabase = await createClient();
    let query = supabase
      .from('messages')
      .select('id, sender_id, recipient_id, target_class_id, title, body, created_at')
      .order('created_at', { ascending: false });

    const scopes = [`recipient_id.eq.${profile.id}`, 'and(recipient_id.is.null,target_class_id.is.null)'];
    if (profile.class_id) scopes.push(`target_class_id.eq.${profile.class_id}`);
    query = query.or(scopes.join(','));

    const { data, error } = await query;
    if (error) throw error;

    const messages = (data ?? []) as MessageRow[];
    if (!messages.length) return [];

    const senderIds = Array.from(new Set(messages.map((message) => message.sender_id).filter(Boolean))) as string[];
    const [sendersResult, readsResult] = await Promise.all([
      senderIds.length
        ? supabase.from('profiles').select('id, full_name').in('id', senderIds)
        : Promise.resolve({ data: [], error: null }),
      supabase
        .from('message_reads')
        .select('message_id, read_at')
        .eq('user_id', profile.id)
        .in(
          'message_id',
          messages.map((message) => message.id),
        ),
    ]);

    if (sendersResult.error || readsResult.error) {
      throw sendersResult.error ?? readsResult.error;
    }

    const senderById = new Map(((sendersResult.data ?? []) as ProfileNameRow[]).map((sender) => [sender.id, sender.full_name]));
    const readByMessageId = new Map(((readsResult.data ?? []) as MessageReadRow[]).map((read) => [read.message_id, read.read_at]));

    return messages.map((message) => ({
      id: message.id,
      senderName: message.sender_id ? senderById.get(message.sender_id) ?? 'Pengirim' : 'WASATIFY',
      title: message.title,
      body: message.body,
      createdAt: message.created_at,
      readAt: readByMessageId.get(message.id) ?? null,
    }));
  } catch {
    return [];
  }
}

export function getUnreadMessageCount(messages: StudentMessageItem[]) {
  return messages.filter((message) => !message.readAt).length;
}
