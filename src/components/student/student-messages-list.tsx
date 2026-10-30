'use client';

import { useAsyncAction } from '@/hooks/use-async-action';

import { useState } from 'react';
import { Mail } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { EmptyState } from '@/components/shared/empty-state';
import { SectionCard } from '@/components/shared/section-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/date';
import { markMessageReadAction } from '@/lib/notification-actions';
import type { StudentMessageItem, StudentMessagesPage } from '@/lib/student/messages';
import { cn } from '@/lib/utils';

export function StudentMessagesList({
  items: messages,
  page,
  hasNextPage,
  hasPreviousPage,
  persistRead = true,
  onMarkRead,
}: StudentMessagesPage & { persistRead?: boolean; onMarkRead?: (messageId: string) => void }) {
  const [openId, setOpenId] = useState<string | null>(messages[0]?.id ?? null);
  const [readIds, setReadIds] = useState(() => new Set(messages.filter((message) => message.readAt).map((message) => message.id)));
  const [isPending, runAction] = useAsyncAction();

  function openMessage(message: StudentMessageItem) {
    setOpenId((current) => (current === message.id ? null : message.id));
    if (readIds.has(message.id)) return;

    setReadIds((current) => new Set(current).add(message.id));
    runAction(async () => {
      if (!persistRead) {
        onMarkRead?.(message.id);
        return;
      }

      try {
        const result = await markMessageReadAction(message.id);
        if (!result.ok) throw new Error(result.error ?? 'Pesan belum berhasil ditandai dibaca.');
      } catch {
        setReadIds((current) => {
          const next = new Set(current);
          next.delete(message.id);
          return next;
        });
        toast.error('Status baca pesan belum tersimpan. Coba lagi.');
      }
    });
  }

  if (!messages.length) {
    return (
      <div className="mt-8 grid gap-4">
        <EmptyState
          icon={Mail}
          title="Belum ada pesan"
          description={hasPreviousPage ? 'Tidak ada pesan lain di halaman ini.' : 'Kotak pesan masih kosong untuk saat ini.'}
        />
        <MessagePagination page={page} hasNextPage={hasNextPage} hasPreviousPage={hasPreviousPage} />
      </div>
    );
  }

  return (
    <div className="mt-8 grid gap-4">
      {messages.map((message) => {
        const unread = !readIds.has(message.id);
        const expanded = openId === message.id;

        return (
          <SectionCard key={message.id} as="article" className={cn(unread && 'border-primary/25 bg-mint/25')}>
            <button type="button" onClick={() => openMessage(message)} disabled={isPending} className="flex w-full items-start gap-4 text-left disabled:cursor-wait">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-mint text-primary">
                <Mail className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-bold text-ink">{message.title}</h2>
                  {unread && <Badge className="bg-gold text-white">Baru</Badge>}
                </div>
                <p className="mt-1 text-xs font-semibold text-primary">
                  {message.senderName} - {formatDateTime(message.createdAt)}
                </p>
                <p className={cn('mt-2 text-sm leading-6 text-muted-foreground', !expanded && 'line-clamp-2')}>
                  {message.body}
                </p>
              </div>
            </button>
            <div className="mt-4 flex justify-end">
              <Button type="button" variant="ghost" size="sm" onClick={() => openMessage(message)} disabled={isPending}>
                {expanded ? 'Tutup' : 'Baca Detail'}
              </Button>
            </div>
          </SectionCard>
        );
      })}
      <MessagePagination page={page} hasNextPage={hasNextPage} hasPreviousPage={hasPreviousPage} />
    </div>
  );
}

function MessagePagination({
  page,
  hasNextPage,
  hasPreviousPage,
}: Pick<StudentMessagesPage, 'page' | 'hasNextPage' | 'hasPreviousPage'>) {
  if (!hasNextPage && !hasPreviousPage) return null;

  return (
    <nav aria-label="Navigasi halaman pesan" className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 pt-2">
      {hasPreviousPage ? (
        <Button asChild variant="outline" size="sm" className="min-h-11 justify-self-start px-3">
          <Link aria-label="Tampilkan pesan yang lebih baru" href={page === 2 ? '/student/messages' : `/student/messages?page=${page - 1}`}>
            Lebih baru
          </Link>
        </Button>
      ) : <span />}
      <span aria-current="page" className="text-center text-sm font-semibold text-muted-foreground">
        Halaman {page}
      </span>
      {hasNextPage ? (
        <Button asChild variant="outline" size="sm" className="min-h-11 justify-self-end px-3">
          <Link aria-label="Tampilkan pesan yang lebih lama" href={`/student/messages?page=${page + 1}`}>
            Lebih lama
          </Link>
        </Button>
      ) : <span />}
    </nav>
  );
}
