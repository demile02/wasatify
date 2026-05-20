'use client';

import type { ReactNode } from 'react';
import { useMemo, useState, useTransition } from 'react';
import { Archive, ArrowDown, ArrowUp, BookOpen, Copy, Eye, MoreVertical, PencilLine, Plus, Search, Send, Trash2, Undo2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { formatDateTime } from '@/lib/date';
import {
  archiveTeacherModuleAction,
  deleteTeacherModuleAction,
  duplicateTeacherModuleAction,
  reorderTeacherModuleAction,
  toggleTeacherModulePublishAction,
} from '@/lib/teacher/actions';
import type { TeacherModuleListItem, TeacherModuleStatus } from '@/lib/teacher/data';
import { cn } from '@/lib/utils';

type TeacherModulesTableProps = {
  modules: TeacherModuleListItem[];
};

type StatusFilter = 'all' | TeacherModuleStatus;
type ConfirmAction = 'archive' | 'delete';

const statusFilters: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Semua' },
  { value: 'published', label: 'Dipublikasikan' },
  { value: 'draft', label: 'Draft' },
  { value: 'archived', label: 'Diarsipkan' },
];

export function TeacherModulesTable({ modules }: TeacherModulesTableProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [pendingModuleId, setPendingModuleId] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<{ action: ConfirmAction; moduleItem: TeacherModuleListItem } | null>(null);
  const [isPending, startTransition] = useTransition();

  const categories = useMemo(() => {
    const values = [...new Set(modules.map((moduleItem) => moduleItem.category).filter(Boolean))];
    return values.sort((first, second) => first.localeCompare(second));
  }, [modules]);

  const filteredModules = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return modules.filter((moduleItem) => {
      const matchesQuery =
        !normalizedQuery ||
        moduleItem.title.toLowerCase().includes(normalizedQuery) ||
        moduleItem.description.toLowerCase().includes(normalizedQuery) ||
        moduleItem.category.toLowerCase().includes(normalizedQuery);
      const matchesCategory = category === 'all' || moduleItem.category === category;
      const matchesStatus = status === 'all' || moduleItem.status === status;

      return matchesQuery && matchesCategory && matchesStatus;
    });
  }, [category, modules, query, status]);

  if (!modules.length) {
    return (
      <EmptyState
        className="mt-8"
        icon={BookOpen}
        title="Belum ada modul"
        description="Modul yang Anda buat di Supabase akan tampil di sini."
        action={
          <Button asChild>
            <Link href="/teacher/modules/new">
              <Plus className="h-4 w-4" />
              Tambah Modul
            </Link>
          </Button>
        }
      />
    );
  }

  function togglePublish(moduleItem: TeacherModuleListItem) {
    setPendingModuleId(moduleItem.id);
    startTransition(async () => {
      const result = await toggleTeacherModulePublishAction({
        moduleId: moduleItem.id,
        currentStatus: moduleItem.status,
      });

      setPendingModuleId(null);

      if (!result.ok) {
        toast.error(result.error ?? 'Status modul belum berhasil diperbarui.');
        return;
      }

      toast.success(result.status === 'published' ? 'Modul dipublikasikan.' : 'Modul dikembalikan ke draft.');
      router.refresh();
    });
  }

  function duplicateModule(moduleItem: TeacherModuleListItem) {
    setPendingModuleId(moduleItem.id);
    startTransition(async () => {
      const result = await duplicateTeacherModuleAction(moduleItem.id);

      setPendingModuleId(null);

      if (!result.ok) {
        toast.error(result.error ?? 'Modul belum berhasil diduplikasi.');
        return;
      }

      toast.success('Modul berhasil diduplikasi sebagai draft.');
      router.refresh();
    });
  }

  function runConfirmedAction() {
    if (!confirmTarget) return;

    const { action, moduleItem } = confirmTarget;
    setPendingModuleId(moduleItem.id);

    startTransition(async () => {
      const result =
        action === 'archive'
          ? await archiveTeacherModuleAction(moduleItem.id)
          : await deleteTeacherModuleAction(moduleItem.id);

      setPendingModuleId(null);
      setConfirmTarget(null);

      if (!result.ok) {
        toast.error(
          result.error ??
            (action === 'archive' ? 'Modul belum berhasil diarsipkan.' : 'Modul belum berhasil dihapus.'),
        );
        return;
      }

      toast.success(action === 'archive' ? 'Modul berhasil diarsipkan.' : 'Modul berhasil dihapus.');
      router.refresh();
    });
  }

  function reorderModule(moduleItem: TeacherModuleListItem, direction: 'up' | 'down') {
    setPendingModuleId(moduleItem.id);
    startTransition(async () => {
      const result = await reorderTeacherModuleAction(moduleItem.id, direction);

      setPendingModuleId(null);

      if (!result.ok) {
        toast.error(result.error ?? 'Urutan modul belum berhasil diperbarui.');
        return;
      }

      toast.success('Urutan modul diperbarui.');
      router.refresh();
    });
  }

  return (
    <div className="mt-8">
      <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto] lg:items-center">
        <div className="flex min-h-12 items-center gap-2 rounded-xl border border-border bg-white px-4 shadow-sm">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari modul berdasarkan judul, kategori, atau deskripsi..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
          />
        </div>

        <select
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className="h-12 rounded-xl border border-border bg-white px-4 text-sm font-semibold text-foreground shadow-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
        >
          <option value="all">Semua Kategori</option>
          {categories.map((categoryItem) => (
            <option key={categoryItem} value={categoryItem}>
              {categoryItem}
            </option>
          ))}
        </select>

        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as StatusFilter)}
          className="h-12 rounded-xl border border-border bg-white px-4 text-sm font-semibold text-foreground shadow-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
        >
          {statusFilters.map((filter) => (
            <option key={filter.value} value={filter.value}>
              {filter.label}
            </option>
          ))}
        </select>
      </div>

      {filteredModules.length ? (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-white shadow-card">
          <table className="w-full min-w-[940px] text-left text-sm">
            <thead className="border-b border-border bg-slate-50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-5 py-4 font-bold">Modul</th>
                <th className="px-5 py-4 font-bold">Kategori</th>
                <th className="px-5 py-4 font-bold">Konten</th>
                <th className="px-5 py-4 font-bold">Durasi</th>
                <th className="px-5 py-4 font-bold">Status</th>
                <th className="px-5 py-4 font-bold">Update</th>
                <th className="px-5 py-4 text-right font-bold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredModules.map((moduleItem) => (
                <tr key={moduleItem.id} className="transition hover:bg-mint/25">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <ModuleThumbnail moduleItem={moduleItem} />
                      <div className="min-w-0">
                        <p className="line-clamp-1 font-extrabold text-ink">{moduleItem.title}</p>
                        <p className="mt-1 line-clamp-1 max-w-md text-xs text-muted-foreground">
                          {moduleItem.description}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 font-semibold text-foreground">{moduleItem.category}</td>
                  <td className="px-5 py-4 text-muted-foreground">
                    <span className="block">{moduleItem.lessonsCount} lesson</span>
                    <span className="mt-1 block text-xs">{moduleItem.quizzesCount} kuis</span>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">{moduleItem.duration}</td>
                  <td className="px-5 py-4">
                    <ModuleStatusBadge status={moduleItem.status} />
                  </td>
                  <td className="px-5 py-4 text-xs text-muted-foreground">
                    {moduleItem.updatedAt ? formatDateTime(moduleItem.updatedAt) : '-'}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <IconAction href={`/teacher/modules/${moduleItem.id}/preview`} label="Preview">
                        <Eye className="h-4 w-4" />
                      </IconAction>
                      <IconAction href={`/teacher/modules/${moduleItem.id}/edit`} label="Edit">
                        <PencilLine className="h-4 w-4" />
                      </IconAction>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 rounded-xl"
                        disabled={isPending && pendingModuleId === moduleItem.id}
                        title="Naik"
                        onClick={() => reorderModule(moduleItem, 'up')}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 rounded-xl"
                        disabled={isPending && pendingModuleId === moduleItem.id}
                        title="Turun"
                        onClick={() => reorderModule(moduleItem, 'down')}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 rounded-xl"
                        disabled={isPending && pendingModuleId === moduleItem.id}
                        title={moduleItem.status === 'published' ? 'Unpublish' : 'Publish'}
                        onClick={() => togglePublish(moduleItem)}
                      >
                        {moduleItem.status === 'published' ? <Undo2 className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 rounded-xl"
                            disabled={isPending && pendingModuleId === moduleItem.id}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => duplicateModule(moduleItem)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Duplikasi modul
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => setConfirmTarget({ action: 'archive', moduleItem })}>
                            <Archive className="mr-2 h-4 w-4" />
                            Arsipkan modul
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onSelect={() => setConfirmTarget({ action: 'delete', moduleItem })}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Hapus Modul
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          className="mt-8"
          icon={Search}
          title="Modul tidak ditemukan"
          description="Coba ubah kata kunci, kategori, atau filter status."
        />
      )}

      <Dialog open={Boolean(confirmTarget)} onOpenChange={(open) => !open && setConfirmTarget(null)}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle>{confirmTarget?.action === 'delete' ? 'Hapus modul?' : 'Arsipkan modul ini?'}</DialogTitle>
            <DialogDescription>
              {confirmTarget?.action === 'delete'
                ? 'Tindakan ini akan menghapus modul beserta konten, kuis, dan pertanyaan terkait. Tindakan ini tidak bisa dibatalkan.'
                : 'Siswa tidak akan melihat modul yang diarsipkan.'}
            </DialogDescription>
          </DialogHeader>
          {confirmTarget ? (
            <div className="rounded-2xl border border-border bg-mint/30 p-4">
              <p className="font-bold text-ink">{confirmTarget.moduleItem.title}</p>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                {confirmTarget.moduleItem.description}
              </p>
            </div>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmTarget(null)}
              disabled={Boolean(isPending && pendingModuleId)}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant={confirmTarget?.action === 'delete' ? 'destructive' : 'default'}
              onClick={runConfirmedAction}
              disabled={Boolean(isPending && pendingModuleId)}
            >
              {confirmTarget?.action === 'delete'
                ? pendingModuleId
                  ? 'Menghapus...'
                  : 'Hapus Modul'
                : pendingModuleId
                  ? 'Mengarsipkan...'
                  : 'Arsipkan Modul'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ModuleThumbnail({ moduleItem }: { moduleItem: TeacherModuleListItem }) {
  if (moduleItem.coverImagePath) {
    return (
      <span
        className="block h-14 w-14 shrink-0 rounded-2xl border border-primary/10 bg-cover bg-center shadow-sm"
        style={{ backgroundImage: `url(${moduleItem.coverImagePath})` }}
      />
    );
  }

  return (
    <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-primary/10 bg-mint text-primary shadow-sm">
      <BookOpen className="h-6 w-6" />
    </span>
  );
}

function ModuleStatusBadge({ status }: { status: TeacherModuleStatus }) {
  const meta = {
    published: {
      label: 'Aktif',
      className: 'border-primary/15 bg-mint text-primary',
    },
    draft: {
      label: 'Draft',
      className: 'border-gold/20 bg-cream text-gold',
    },
    archived: {
      label: 'Diarsipkan',
      className: 'border-slate-200 bg-slate-100 text-slate-600',
    },
  }[status];

  return (
    <span className={cn('inline-flex rounded-full border px-3 py-1 text-xs font-bold', meta.className)}>
      {meta.label}
    </span>
  );
}

function IconAction({ href, label, children }: { href: string; label: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      className="grid h-9 w-9 place-items-center rounded-xl border border-border bg-white text-muted-foreground transition hover:bg-mint hover:text-primary"
    >
      {children}
    </Link>
  );
}
