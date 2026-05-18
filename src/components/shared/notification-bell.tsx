'use client';

import { useState } from 'react';
import { Bell, Megaphone } from 'lucide-react';
import Link from 'next/link';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDateTime } from '@/lib/date';
import type { NotificationItem } from '@/lib/notifications';

type NotificationBellProps = {
  items: NotificationItem[];
  emptyTitle?: string;
};

export function NotificationBell({ items, emptyTitle = 'Belum ada notifikasi.' }: NotificationBellProps) {
  const [hasOpened, setHasOpened] = useState(false);
  const count = items.length;
  const visibleCount = hasOpened ? 0 : count;

  return (
    <DropdownMenu onOpenChange={(open) => open && setHasOpened(true)}>
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
          <p className="font-extrabold text-ink">Notifikasi</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {count ? `${count} notifikasi terbaru` : 'Aktivitas terbaru akan tampil di sini.'}
          </p>
        </div>

        {items.length ? (
          <div className="max-h-[420px] overflow-y-auto p-2">
            {items.map((item) => (
              <Button
                key={item.id}
                asChild
                variant="ghost"
                className="h-auto w-full justify-start rounded-xl px-3 py-3 text-left hover:bg-mint/55"
              >
                <Link href={item.href}>
                  <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-mint text-primary">
                    <Megaphone className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-ink">{item.title}</span>
                    <span className="mt-1 line-clamp-2 block whitespace-normal text-xs leading-5 text-muted-foreground">
                      {item.body}
                    </span>
                    <span className="mt-1 block text-[11px] font-semibold text-primary">
                      {formatDateTime(item.createdAt)}
                    </span>
                  </span>
                </Link>
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
