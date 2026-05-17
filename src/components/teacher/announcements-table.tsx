'use client';

import { useMemo, useState, useTransition } from 'react';
import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarClock, CheckCircle2, FileText, Megaphone, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { EmptyState } from '@/components/shared/empty-state';
import { SectionCard } from '@/components/shared/section-card';
import { StatCard } from '@/components/shared/stat-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { AnnouncementFormDialog } from '@/components/teacher/announcement-form-dialog';
import {
  deleteAnnouncementAction,
  toggleAnnouncementStatusAction,
} from '@/lib/teacher/announcement-actions';
import type { TeacherAnnouncementsData } from '@/lib/teacher/announcements';

type AnnouncementsTableProps = {
  data: TeacherAnnouncementsData;
};

export function AnnouncementsTable({ data }: AnnouncementsTableProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [target, setTarget] = useState('all');
  const [status, setStatus] = useState('all');
  const [isPending, startTransition] = useTransition();

  const filteredAnnouncements = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return data.announcements.filter((announcement) => {
      const matchesQuery =
        !normalizedQuery ||
        announcement.title.toLowerCase().includes(normalizedQuery) ||
        announcement.content.toLowerCase().includes(normalizedQuery);
      const matchesTarget =
        target === 'all' || (target === 'global' && !announcement.classId) || announcement.classId === target;
      const matchesStatus = status === 'all' || announcement.status === status;

      return matchesQuery && matchesTarget && matchesStatus;
    });
  }, [data.announcements, query, status, target]);

  function handleToggle(id: string, nextStatus: 'draft' | 'published') {
    startTransition(async () => {
      const result = await toggleAnnouncementStatusAction(id, nextStatus);

      if (!result.ok) {
        toast.error(result.error ?? 'Status pengumuman belum berhasil diubah.');
        return;
      }

      toast.success(nextStatus === 'published' ? 'Pengumuman dipublikasikan.' : 'Pengumuman dikembalikan ke draft.');
      router.refresh();
    });
  }

  function handleDelete(id: string) {
    if (!window.confirm('Hapus pengumuman ini? Aksi ini tidak bisa dibatalkan.')) return;

    startTransition(async () => {
      const result = await deleteAnnouncementAction(id);

      if (!result.ok) {
        toast.error(result.error ?? 'Pengumuman belum berhasil dihapus.');
        return;
      }

      toast.success('Pengumuman dihapus.');
      router.refresh();
    });
  }

  return (
    <div className="mt-8 space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Pengumuman" value={data.summary.total} icon={Megaphone} />
        <StatCard label="Published" value={data.summary.published} icon={CheckCircle2} tone="mint" />
        <StatCard label="Draft" value={data.summary.draft} icon={FileText} tone="gold" />
        <StatCard label="Minggu Ini" value={data.summary.thisWeek} icon={CalendarClock} />
      </div>

      <SectionCard className="space-y-4">
        <div className="grid gap-3 xl:grid-cols-[1.4fr_1fr_1fr_auto] xl:items-center">
          <label className="flex min-h-12 items-center gap-2 rounded-xl border border-border bg-white px-4 shadow-sm">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari pengumuman..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
            />
          </label>

          <FilterSelect value={target} onChange={setTarget} label="Semua Target">
            <option value="global">Global</option>
            {data.classes.map((classItem) => (
              <option key={classItem.id} value={classItem.id}>
                {classItem.name}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect value={status} onChange={setStatus} label="Semua Status">
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </FilterSelect>

          <AnnouncementFormDialog classes={data.classes} />
        </div>

        {filteredAnnouncements.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-3 pr-4">Judul</th>
                  <th className="px-4 py-3">Isi</th>
                  <th className="px-4 py-3">Target</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="py-3 pl-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredAnnouncements.map((announcement) => (
                  <tr key={announcement.id} className="border-b border-border/70 last:border-0">
                    <td className="py-4 pr-4 align-top">
                      <p className="font-bold text-ink">{announcement.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">Dibuat {formatDate(announcement.createdAt)}</p>
                    </td>
                    <td className="app-readable px-4 py-4 align-top text-muted-foreground">{truncate(announcement.content, 120)}</td>
                    <td className="px-4 py-4 align-top font-semibold text-foreground">{announcement.className}</td>
                    <td className="px-4 py-4 align-top">
                      <StatusBadge
                        status={announcement.status === 'published' ? 'completed' : 'not_started'}
                        label={announcement.status === 'published' ? 'Published' : 'Draft'}
                      />
                    </td>
                    <td className="px-4 py-4 align-top text-muted-foreground">
                      {announcement.publishedAt ? formatDate(announcement.publishedAt) : '-'}
                    </td>
                    <td className="py-4 pl-4 align-top">
                      <div className="flex justify-end gap-2">
                        <AnnouncementFormDialog classes={data.classes} announcement={announcement} />
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={isPending}
                          onClick={() =>
                            handleToggle(announcement.id, announcement.status === 'published' ? 'draft' : 'published')
                          }
                        >
                          {announcement.status === 'published' ? 'Unpublish' : 'Publish'}
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          disabled={isPending}
                          onClick={() => handleDelete(announcement.id)}
                          aria-label="Hapus pengumuman"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={Megaphone}
            title={data.announcements.length ? 'Pengumuman tidak ditemukan' : 'Belum ada pengumuman'}
            description={
              data.announcements.length
                ? 'Coba ubah pencarian atau filter yang digunakan.'
                : 'Buat pengumuman pertama untuk memberi informasi penting kepada siswa.'
            }
            action={!data.announcements.length ? <AnnouncementFormDialog classes={data.classes} /> : undefined}
          />
        )}
      </SectionCard>
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  label,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  children: ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-12 w-full rounded-xl border border-border bg-white px-4 text-sm font-semibold text-foreground shadow-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
    >
      <option value="all">{label}</option>
      {children}
    </select>
  );
}

function truncate(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}...` : value;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}
