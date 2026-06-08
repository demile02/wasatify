'use client';

import { useState, useTransition } from 'react';
import { Mail } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { SectionCard } from '@/components/shared/section-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/date';
import { markMessageReadAction } from '@/lib/notification-actions';
import type { StudentMessageItem } from '@/lib/student/messages';
import { cn } from '@/lib/utils';

type StudentMessagesListProps = {
  messages: StudentMessageItem[];
};

export function StudentMessagesList({ messages }: StudentMessagesListProps) {
  const [openId, setOpenId] = useState<string | null>(messages[0]?.id ?? null);
  const [readIds, setReadIds] = useState(() => new Set(messages.filter((message) => message.readAt).map((message) => message.id)));
  const [, startTransition] = useTransition();

  function openMessage(message: StudentMessageItem) {
    setOpenId((current) => (current === message.id ? null : message.id));
    if (readIds.has(message.id)) return;

    setReadIds((current) => new Set(current).add(message.id));
    startTransition(async () => {
      await markMessageReadAction(message.id);
    });
  }

  if (!messages.length) {
    return (
      <EmptyState
        className="mt-8"
        icon={Mail}
        title="Belum ada pesan"
        description="Kotak pesan masih kosong untuk saat ini."
      />
    );
  }

  return (
    <div className="mt-8 grid gap-4">
      {messages.map((message) => {
        const unread = !readIds.has(message.id);
        const expanded = openId === message.id;

        return (
          <SectionCard key={message.id} as="article" className={cn(unread && 'border-primary/25 bg-mint/25')}>
            <button type="button" onClick={() => openMessage(message)} className="flex w-full items-start gap-4 text-left">
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
              <Button type="button" variant="ghost" size="sm" onClick={() => openMessage(message)}>
                {expanded ? 'Tutup' : 'Baca Detail'}
              </Button>
            </div>
          </SectionCard>
        );
      })}
    </div>
  );
}
