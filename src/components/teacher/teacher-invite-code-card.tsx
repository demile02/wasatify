'use client';

import { CalendarClock, X } from 'lucide-react';
import { SectionCard } from '@/components/shared/section-card';
import { Button } from '@/components/ui/button';
import type { TeacherInviteCodeRecord } from '@/lib/admin/teacher-invite-actions';

export type InviteStatus = 'used' | 'active' | 'inactive' | 'expired';

export function getInviteStatus(invite: TeacherInviteCodeRecord): InviteStatus {
  if (invite.used_at) return 'used';
  if (!invite.is_active) return 'inactive';
  if (invite.expires_at && new Date(invite.expires_at).getTime() <= Date.now()) return 'expired';
  return 'active';
}

const statusDetails: Record<InviteStatus, { label: string; className: string }> = {
  used: { label: 'Terpakai', className: 'bg-slate-100 text-slate-700' },
  active: { label: 'Aktif', className: 'bg-emerald-50 text-emerald-800' },
  inactive: { label: 'Nonaktif', className: 'bg-slate-100 text-slate-700' },
  expired: { label: 'Kedaluwarsa', className: 'bg-red-50 text-red-700' },
};

export function InviteCodeCard({
  invite,
  onCopy,
  onCancel,
  isPending,
}: {
  invite: TeacherInviteCodeRecord;
  onCopy: (code: string) => void;
  onCancel: (invite: TeacherInviteCodeRecord) => void;
  isPending: boolean;
}) {
  const status = getInviteStatus(invite);
  const detail = statusDetails[status];

  return (
    <SectionCard as="article" className="relative flex h-full min-w-0 flex-col p-4 sm:p-5">
      {status === 'active' && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-0 top-0 z-10 -translate-y-[20%] translate-x-[20%] rounded-full border border-red-200 bg-white text-red-700 shadow-card hover:bg-red-50 hover:text-red-800"
          onClick={() => onCancel(invite)}
          disabled={isPending}
          title="Batalkan kode"
          aria-label={`Batalkan kode ${invite.code}`}
        >
          <X className="h-5 w-5" />
        </Button>
      )}
      <div className="flex min-h-11 min-w-0 items-start justify-between gap-2">
        <button
          type="button"
          onClick={() => onCopy(invite.code)}
          title="Klik untuk menyalin kode"
          aria-label={`Salin kode ${invite.code}`}
          className="min-w-0 break-all rounded-lg bg-mint/70 px-2.5 py-1.5 text-left font-mono text-sm font-bold tracking-wide text-ink transition-colors hover:bg-mint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {invite.code}
        </button>
        <span className={`ml-auto shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${status === 'active' ? 'mr-5' : ''} ${detail.className}`}>
          {detail.label}
        </span>
      </div>
      {invite.teacher_name && (
        <p className="mt-2 break-words text-sm font-semibold text-ink">{invite.teacher_name}</p>
      )}
      <div className="mt-auto min-w-0 space-y-1 pt-4 text-xs text-muted-foreground">
        <p>Dibuat {formatDate(invite.created_at)}</p>
        <p className="flex min-w-0 items-start gap-2">
          <CalendarClock className="h-4 w-4 shrink-0" />
          <span className="break-words">{invite.expires_at ? `Berlaku sampai ${formatDate(invite.expires_at)}` : 'Tidak ada batas waktu'}</span>
        </p>
      </div>
    </SectionCard>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Jakarta',
  }).format(new Date(value));
}
