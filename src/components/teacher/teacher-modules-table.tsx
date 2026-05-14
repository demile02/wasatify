'use client';

import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { BookOpen, Eye, MoreVertical, PencilLine, Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import type { TeacherModuleListItem, TeacherModuleStatus } from '@/lib/teacher/data';
import { cn } from '@/lib/utils';

type TeacherModulesTableProps = {
  modules: TeacherModuleListItem[];
};

type StatusFilter = 'all' | TeacherModuleStatus;

const statusFilters: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Semua Status' },
  { value: 'published', label: 'Aktif' },
  { value: 'draft', label: 'Draft' },
  { value: 'archived', label: 'Nonaktif' },
];

export function TeacherModulesTable({ modules }: TeacherModulesTableProps) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState<StatusFilter>('all');

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
                <th className="px-5 py-4 font-bold">Pelajaran</th>
                <th className="px-5 py-4 font-bold">Durasi</th>
                <th className="px-5 py-4 font-bold">Status</th>
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
                  <td className="px-5 py-4 text-muted-foreground">{moduleItem.lessonsCount} pelajaran</td>
                  <td className="px-5 py-4 text-muted-foreground">{moduleItem.duration}</td>
                  <td className="px-5 py-4">
                    <ModuleStatusBadge status={moduleItem.status} />
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <IconAction href={`/teacher/modules/${moduleItem.id}/edit?preview=1`} label="Lihat">
                        <Eye className="h-4 w-4" />
                      </IconAction>
                      <IconAction href={`/teacher/modules/${moduleItem.id}/edit`} label="Edit">
                        <PencilLine className="h-4 w-4" />
                      </IconAction>
                      <button
                        type="button"
                        aria-label={`Aksi lainnya untuk ${moduleItem.title}`}
                        className="grid h-9 w-9 place-items-center rounded-xl border border-border bg-white text-muted-foreground transition hover:bg-mint hover:text-primary"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
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
      label: 'Nonaktif',
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
