'use client';

import { useAsyncAction } from '@/hooks/use-async-action';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound, Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { EmptyState } from '@/components/shared/empty-state';
import { InviteCodeCard, getInviteStatus, type InviteStatus } from '@/components/teacher/teacher-invite-code-card';
import { SectionCard } from '@/components/shared/section-card';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  cancelTeacherInviteCodeAction,
  generateTeacherInviteCodeAction,
  type TeacherInviteCodeRecord,
} from '@/lib/admin/teacher-invite-actions';

type TeacherInviteCodesManagerProps = {
  initialInvites: TeacherInviteCodeRecord[];
};

type InviteFilter = 'all' | InviteStatus;

const inviteFilters: { value: InviteFilter; label: string }[] = [
  { value: 'all', label: 'Semua' },
  { value: 'used', label: 'Digunakan' },
  { value: 'active', label: 'Aktif' },
  { value: 'inactive', label: 'Nonaktif' },
  { value: 'expired', label: 'Kedaluwarsa' },
];

export function TeacherInviteCodesManager({ initialInvites }: TeacherInviteCodesManagerProps) {
  const [invites, setInvites] = useState(initialInvites);
  const [, setClock] = useState(0);
  const [expiresInDays, setExpiresInDays] = useState<1 | 3 | 7>(3);
  const [teacherName, setTeacherName] = useState('');
  const [filter, setFilter] = useState<InviteFilter>('all');
  const [cancelTarget, setCancelTarget] = useState<TeacherInviteCodeRecord | null>(null);
  const [isPending, runAction] = useAsyncAction();
  const router = useRouter();
  const visibleInvites = filter === 'all' ? invites : invites.filter((invite) => getInviteStatus(invite) === filter);

  useEffect(() => {
    setInvites(initialInvites);
  }, [initialInvites]);

  useEffect(() => {
    const nextExpiry = invites
      .filter((invite) => invite.is_active && !invite.used_at && invite.expires_at)
      .map((invite) => new Date(invite.expires_at!).getTime())
      .filter((expiresAt) => expiresAt > Date.now())
      .sort((left, right) => left - right)[0];

    if (!nextExpiry) return;

    const timeout = window.setTimeout(
      () => setClock(Date.now()),
      Math.min(nextExpiry - Date.now() + 25, 2_147_000_000),
    );
    return () => window.clearTimeout(timeout);
  }, [invites]);

  useEffect(() => {
    const supabase = createClient();
    let refreshTimeout: number | undefined;
    const refresh = () => {
      window.clearTimeout(refreshTimeout);
      refreshTimeout = window.setTimeout(() => router.refresh(), 120);
    };
    const channel = supabase
      .channel('admin-teacher-invite-codes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'teacher_invite_codes' },
        refresh,
      )
      .subscribe();
    const fallbackRefresh = window.setInterval(() => {
      if (document.visibilityState === 'visible') router.refresh();
    }, 5_000);
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') refresh();
    };

    window.addEventListener('focus', refreshWhenVisible);
    document.addEventListener('visibilitychange', refreshWhenVisible);

    return () => {
      window.clearTimeout(refreshTimeout);
      window.clearInterval(fallbackRefresh);
      window.removeEventListener('focus', refreshWhenVisible);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
      void supabase.removeChannel(channel);
    };
  }, [router]);

  function createCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    runAction(async () => {
      const result = await generateTeacherInviteCodeAction(teacherName, expiresInDays);

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      setInvites((current) => [result.invite, ...current.filter((invite) => invite.id !== result.invite.id)].slice(0, 50));
      setTeacherName('');
      toast.success('Kode guru berhasil dibuat. Bagikan sebelum masa berlakunya habis.');
    });
  }

  function cancelCode() {
    if (!cancelTarget) return;
    const inviteId = cancelTarget.id;
    runAction(async () => {
      const result = await cancelTeacherInviteCodeAction(inviteId);
      if (!result.ok) {
        toast.error(result.error);
        setCancelTarget(null);
        return;
      }

      setInvites((current) => current.map((invite) => invite.id === inviteId ? result.invite : invite));
      setCancelTarget(null);
      toast.success('Kode guru dibatalkan dan tidak bisa digunakan lagi.');
    });
  }

  async function copyCode(code: string) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(code);
      } else {
        const temporaryInput = document.createElement('textarea');
        temporaryInput.value = code;
        temporaryInput.setAttribute('readonly', '');
        temporaryInput.dataset.copyAllowed = 'true';
        temporaryInput.className = 'fixed left-0 top-0 h-px w-px opacity-0';
        document.body.append(temporaryInput);
        temporaryInput.select();
        const copied = document.execCommand('copy');
        temporaryInput.remove();
        if (!copied) throw new Error('Clipboard tidak tersedia.');
      }

      toast.success('Kode disalin.');
    } catch {
      toast.error('Kode belum dapat disalin. Coba lagi dari browser yang mendukung clipboard.');
    }
  }

  return (
    <div className="mt-8 space-y-8">
      <SectionCard>
        <form onSubmit={createCode} className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_minmax(10rem,0.45fr)_auto] sm:items-end">
          <label className="grid min-w-0 gap-2 text-sm font-semibold text-ink">
            Nama guru
            <input
              type="text"
              value={teacherName}
              onChange={(event) => setTeacherName(event.target.value)}
              maxLength={120}
              required
              autoComplete="name"
              placeholder="Nama guru penerima kode"
              className="h-11 w-full rounded-xl border border-border bg-white px-3 text-sm font-medium text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            />
          </label>
          <label className="grid min-w-0 gap-2 text-sm font-semibold text-ink">
            Masa berlaku
            <select
              value={expiresInDays}
              onChange={(event) => setExpiresInDays(Number(event.target.value) as 1 | 3 | 7)}
              className="h-11 w-full rounded-xl border border-border bg-white px-3 text-sm font-medium text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              <option value={1}>1 hari</option>
              <option value={3}>3 hari</option>
              <option value={7}>7 hari</option>
            </select>
          </label>
          <Button type="submit" disabled={isPending} className="min-h-11 w-full sm:w-auto">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {isPending ? 'Membuat kode…' : 'Buat Kode Guru'}
          </Button>
        </form>
      </SectionCard>

      <section aria-labelledby="invite-list-title">
        <div className="mb-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:items-center">
          <div>
            <h2 id="invite-list-title" className="text-lg font-extrabold text-ink">Kode Terbaru</h2>
            <p className="mt-1 text-sm text-muted-foreground">Filter berlaku untuk 50 kode terbaru.</p>
          </div>
          <label className="grid gap-2 text-sm font-semibold text-ink lg:hidden">
            Filter status
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value as InviteFilter)}
              className="h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              {inviteFilters.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <div role="group" aria-label="Filter status kode guru" className="hidden items-center gap-1 rounded-xl border border-border bg-white p-1 lg:flex">
            {inviteFilters.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setFilter(option.value)}
                aria-pressed={filter === option.value}
                className={`min-h-10 rounded-lg px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${filter === option.value ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-mint hover:text-primary'}`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <p aria-live="polite" className="text-sm font-semibold text-muted-foreground lg:justify-self-end">
            {filter === 'all' ? `${invites.length} kode` : `${visibleInvites.length} dari ${invites.length} kode`}
          </p>
        </div>

        {visibleInvites.length ? (
          <div className="grid min-w-0 gap-6 px-2 pt-6 sm:grid-cols-2 lg:grid-cols-3">
            {visibleInvites.map((invite) => (
              <InviteCodeCard
                key={invite.id}
                invite={invite}
                onCopy={copyCode}
                onCancel={setCancelTarget}
                isPending={isPending}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={KeyRound}
            title={invites.length ? 'Tidak ada kode dengan status ini' : 'Belum ada kode undangan'}
            description={invites.length ? 'Pilih filter lain untuk melihat kode yang tersedia.' : 'Buat kode pertama di atas, lalu kirimkan kepada guru yang akan mendaftar.'}
          />
        )}
      </section>

      <Dialog open={Boolean(cancelTarget)} onOpenChange={(open) => { if (!open && !isPending) setCancelTarget(null); }}>
        <DialogContent showCloseButton={false} className="w-[calc(100vw-2rem)] max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Batalkan kode guru?</DialogTitle>
            <DialogDescription className="leading-6">
              Kode {cancelTarget?.code} tidak bisa digunakan untuk pendaftaran setelah dibatalkan. Riwayatnya tetap tampil di sini.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:space-x-0">
            <Button type="button" variant="outline" onClick={() => setCancelTarget(null)} disabled={isPending}>
              Kembali
            </Button>
            <Button type="button" variant="destructive" onClick={cancelCode} disabled={isPending}>
              {isPending ? 'Membatalkan…' : 'Batalkan kode'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
