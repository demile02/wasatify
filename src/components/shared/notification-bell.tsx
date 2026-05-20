'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { Bell, CheckCheck, ClipboardCheck, GraduationCap, Megaphone, MessageSquareText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDateTime } from '@/lib/date';
import { markAllNotificationsReadAction, markNotificationReadAction } from '@/lib/notification-actions';
import type { NotificationItem } from '@/lib/notifications';
import { cn } from '@/lib/utils';

type NotificationBellProps = {
  items: NotificationItem[];
  emptyTitle?: string;
};

export function NotificationBell({ items, emptyTitle = 'Belum ada notifikasi.' }: NotificationBellProps) {
  const router = useRouter();
  const [readKeys, setReadKeys] = useState(() => new Set(items.filter((item) => item.readAt).map((item) => item.notificationKey)));
  const [isPending, startTransition] = useTransition();
  const unreadItems = useMemo(
    () => items.filter((item) => !readKeys.has(item.notificationKey)),
    [items, readKeys],
  );
  const count = items.length;
  const visibleCount = unreadItems.length;

  useEffect(() => {
    setReadKeys((current) => {
      const next = new Set(current);
      for (const item of items) {
        if (item.readAt) next.add(item.notificationKey);
      }
      return next;
    });
  }, [items]);

  function markOneRead(item: NotificationItem) {
    setReadKeys((current) => new Set(current).add(item.notificationKey));
    startTransition(async () => {
      await markNotificationReadAction(item.notificationKey);
      router.push(item.href);
    });
  }

  function markAllRead() {
    const keys = unreadItems.map((item) => item.notificationKey);
    if (!keys.length) return;

    setReadKeys((current) => {
      const next = new Set(current);
      keys.forEach((key) => next.add(key));
      return next;
    });

    startTransition(async () => {
      await markAllNotificationsReadAction(keys);
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Buka notifikasi"
          className="relative ml-auto grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border bg-white text-foreground shadow-sm transition hover:bg-mint md:ml-0 md:h-11 md:w-11"
        >
          <Bell className="h-5 w-5" />
          {visibleCount > 0 && (
            <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-gold px-1.5 text-[10px] font-extrabold text-white shadow-sm">
              {visibleCount > 9 ? '9+' : visibleCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="z-[80] w-[calc(100vw-2rem)] max-w-sm rounded-2xl border border-border bg-white p-0 shadow-soft"
      >
        <div className="border-b border-border px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-extrabold text-ink">Notifikasi</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {count ? `${visibleCount} belum dibaca dari ${count} notifikasi` : 'Aktivitas terbaru akan tampil di sini.'}
              </p>
            </div>
            {visibleCount > 0 && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={isPending}
                onClick={markAllRead}
                className="h-auto shrink-0 rounded-xl px-2 py-1.5 text-xs text-primary"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Tandai semua
              </Button>
            )}
          </div>
        </div>

        {items.length ? (
          <div className="max-h-[420px] overflow-y-auto p-2">
            {items.map((item) => (
              <Button
                key={item.id}
                type="button"
                variant="ghost"
                onClick={() => markOneRead(item)}
                disabled={isPending}
                className={cn(
                  'h-auto w-full justify-start rounded-xl px-3 py-3 text-left hover:bg-mint/55',
                  !readKeys.has(item.notificationKey) && 'bg-mint/35',
                )}
              >
                <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-mint text-primary">
                  <NotificationIcon kind={item.kind} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    {!readKeys.has(item.notificationKey) && <span className="h-2 w-2 shrink-0 rounded-full bg-gold" />}
                    <span className="block truncate text-sm font-bold text-ink">{item.title}</span>
                  </span>
                  <span className="mt-1 line-clamp-2 block whitespace-normal text-xs leading-5 text-muted-foreground">
                    {item.body}
                  </span>
                  <span className="mt-1 block text-[11px] font-semibold text-primary">
                    {formatDateTime(item.createdAt)}
                  </span>
                </span>
              </Button>
            ))}
          </div>
        ) : (
          <div className="p-4">
            <EmptyState
              icon={Bell}
              title={emptyTitle}
              description="Pengumuman dan aktivitas terbaru akan muncul setelah tersedia."
              className="border-dashed bg-background/70 py-8"
            />
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NotificationIcon({ kind }: { kind: NotificationItem['kind'] }) {
  if (kind === 'reflection') return <MessageSquareText className="h-4 w-4" />;
  if (kind === 'quiz_attempt') return <ClipboardCheck className="h-4 w-4" />;
  if (kind === 'module_progress') return <GraduationCap className="h-4 w-4" />;
  return <Megaphone className="h-4 w-4" />;
}
