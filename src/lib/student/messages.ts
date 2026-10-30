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

export type StudentMessagesPage = {
  items: StudentMessageItem[];
  page: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

const messagesPerPage = 30;

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

export async function getStudentMessagesData(profile: Profile, requestedPage = 1): Promise<StudentMessagesPage> {
  const page = Number.isSafeInteger(requestedPage) ? Math.max(1, requestedPage) : 1;
  const emptyPage = { items: [], page, hasNextPage: false, hasPreviousPage: page > 1 };
  if (!isSupabaseConfigured) return emptyPage;

  try {
    const supabase = await createClient();
    let query = supabase
      .from('messages')
      .select('id, sender_id, recipient_id, target_class_id, title, body, created_at')
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .range((page - 1) * messagesPerPage, page * messagesPerPage);

    const scopes = [`recipient_id.eq.${profile.id}`, 'and(recipient_id.is.null,target_class_id.is.null)'];
    if (profile.class_id) scopes.push(`target_class_id.eq.${profile.class_id}`);
    query = query.or(scopes.join(','));

    const { data, error } = await query;
    if (error) throw error;

    const messages = (data ?? []) as MessageRow[];
    if (!messages.length) return emptyPage;

    const hasNextPage = messages.length > messagesPerPage;
    const visibleMessages = messages.slice(0, messagesPerPage);

    const senderIds = Array.from(new Set(visibleMessages.map((message) => message.sender_id).filter(Boolean))) as string[];
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
          visibleMessages.map((message) => message.id),
        ),
    ]);

    if (sendersResult.error || readsResult.error) {
      throw sendersResult.error ?? readsResult.error;
    }

    const senderById = new Map(((sendersResult.data ?? []) as ProfileNameRow[]).map((sender) => [sender.id, sender.full_name]));
    const readByMessageId = new Map(((readsResult.data ?? []) as MessageReadRow[]).map((read) => [read.message_id, read.read_at]));

    return {
      items: visibleMessages.map((message) => ({
        id: message.id,
        senderName: message.sender_id ? senderById.get(message.sender_id) ?? 'Pengirim' : 'WASATIFY',
        title: message.title,
        body: message.body,
        createdAt: message.created_at,
        readAt: readByMessageId.get(message.id) ?? null,
      })),
      page,
      hasNextPage,
      hasPreviousPage: page > 1,
    };
  } catch (error) {
    throw new Error('Pesan gagal dimuat. Silakan coba lagi.', { cause: error });
  }
}

export async function getStudentUnreadMessageCount(profile: Profile): Promise<number> {
  if (!isSupabaseConfigured) return 0;

  try {
    const supabase = await createClient();
    let query = supabase.from('messages').select('id');
    const scopes = [`recipient_id.eq.${profile.id}`, 'and(recipient_id.is.null,target_class_id.is.null)'];
    if (profile.class_id) scopes.push(`target_class_id.eq.${profile.class_id}`);
    query = query.or(scopes.join(','));

    const { data: messages, error: messagesError } = await query;
    if (messagesError) throw messagesError;
    if (!messages?.length) return 0;

    const messageIds = messages.map((message) => message.id);
    const readCounts = await Promise.all(
      Array.from({ length: Math.ceil(messageIds.length / 150) }, (_, index) =>
        supabase
          .from('message_reads')
          .select('message_id', { count: 'exact', head: true })
          .eq('user_id', profile.id)
          .in('message_id', messageIds.slice(index * 150, (index + 1) * 150)),
      ),
    );
    const readCount = readCounts.reduce((total, result) => {
      if (result.error) throw result.error;
      return total + (result.count ?? 0);
    }, 0);

    return Math.max(0, messages.length - readCount);
  } catch (error) {
    throw new Error('Jumlah pesan belum berhasil dimuat.', { cause: error });
  }
}
