'use client';

import { useState, useTransition } from 'react';
import { Megaphone } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { SectionCard } from '@/components/shared/section-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/date';
import { markNotificationReadAction } from '@/lib/notification-actions';
import type { StudentAnnouncementItem } from '@/lib/student/announcements';
import { cn } from '@/lib/utils';

type StudentAnnouncementsListProps = {
  announcements: StudentAnnouncementItem[];
};

export function StudentAnnouncementsList({ announcements }: StudentAnnouncementsListProps) {
  const [openId, setOpenId] = useState<string | null>(announcements[0]?.id ?? null);
  const [readKeys, setReadKeys] = useState(() => new Set(announcements.filter((item) => item.readAt).map((item) => item.notificationKey)));
  const [, startTransition] = useTransition();

  function openAnnouncement(announcement: StudentAnnouncementItem) {
    setOpenId((current) => (current === announcement.id ? null : announcement.id));
    if (readKeys.has(announcement.notificationKey)) return;

    setReadKeys((current) => new Set(current).add(announcement.notificationKey));
    startTransition(async () => {
      await markNotificationReadAction(announcement.notificationKey);
    });
  }

  if (!announcements.length) {
    return (
      <EmptyState
        className="mt-8"
        icon={Megaphone}
        title="Belum ada pengumuman"
        description="Pengumuman dari guru dan platform akan muncul di sini."
      />
    );
  }

  return (
    <div className="mt-8 grid gap-4">
      {announcements.map((announcement) => {
        const unread = !readKeys.has(announcement.notificationKey);
        const expanded = openId === announcement.id;

        return (
          <SectionCard key={announcement.id} as="article" className={cn(unread && 'border-primary/25 bg-mint/25')}>
            <button
              type="button"
              onClick={() => openAnnouncement(announcement)}
              className="flex w-full items-start gap-4 text-left"
            >
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-mint text-primary">
                <Megaphone className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-bold text-ink">{announcement.title}</h2>
                  {unread && <Badge className="bg-gold text-white">Baru</Badge>}
                </div>
                <p className="mt-1 text-xs font-semibold text-primary">{formatDateTime(announcement.publishedAt)}</p>
                <p className={cn('mt-2 text-sm leading-6 text-muted-foreground', !expanded && 'line-clamp-2')}>
                  {announcement.content}
                </p>
              </div>
            </button>
            <div className="mt-4 flex justify-end">
              <Button type="button" variant="ghost" size="sm" onClick={() => openAnnouncement(announcement)}>
                {expanded ? 'Tutup' : 'Baca Detail'}
              </Button>
            </div>
          </SectionCard>
        );
      })}
    </div>
  );
}
