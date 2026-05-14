'use client';

import { BookOpen, Clock, Lock, Search } from 'lucide-react';
import Link from 'next/link';
import { EmptyState } from '@/components/shared/empty-state';
import { ProgressBar } from '@/components/shared/progress-bar';
import { StatusBadge } from '@/components/shared/status-badge';
import type { StudentModule } from '@/lib/demo/student';
import type { ModuleStatus } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useMemo, useState } from 'react';

type ModuleExplorerProps = {
  modules: StudentModule[];
};

type FilterValue = 'all' | ModuleStatus;

const filters: { label: string; value: FilterValue }[] = [
  { label: 'Semua', value: 'all' },
  { label: 'Selesai', value: 'completed' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Belum Dimulai', value: 'not_started' },
  { label: 'Terkunci', value: 'locked' },
];

export function ModuleExplorer({ modules }: ModuleExplorerProps) {
  const [activeFilter, setActiveFilter] = useState<FilterValue>('all');
  const [query, setQuery] = useState('');

  const filteredModules = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return modules.filter((moduleItem) => {
      const matchesFilter = activeFilter === 'all' || moduleItem.status === activeFilter;
      const matchesQuery =
        !normalizedQuery ||
        moduleItem.title.toLowerCase().includes(normalizedQuery) ||
        moduleItem.description.toLowerCase().includes(normalizedQuery);

      return matchesFilter && matchesQuery;
    });
  }, [activeFilter, modules, query]);

  if (!modules.length) {
    return (
      <EmptyState
        className="mt-8"
        icon={BookOpen}
        title="Belum ada modul tersedia"
        description="Modul published dari Supabase akan tampil di sini setelah tersedia."
      />
    );
  }

  return (
    <div className="mt-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {filters.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setActiveFilter(filter.value)}
              className={cn(
                'shrink-0 rounded-xl border px-4 py-2.5 text-sm font-bold transition',
                activeFilter === filter.value
                  ? 'border-primary bg-primary text-white shadow-card'
                  : 'border-border bg-white text-muted-foreground hover:bg-mint hover:text-primary',
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="flex min-h-12 w-full items-center gap-2 rounded-xl border border-border bg-white px-4 shadow-sm xl:max-w-sm">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari modul..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
          />
        </div>
      </div>

      {filteredModules.length ? (
        <div className="mt-6 space-y-4">
          {filteredModules.map((moduleItem, index) => (
            <ModuleListItem key={moduleItem.id} moduleItem={moduleItem} index={index + 1} />
          ))}
        </div>
      ) : (
        <EmptyState
          className="mt-8"
          icon={Search}
          title="Modul tidak ditemukan"
          description="Coba ubah kata kunci pencarian atau filter status modul."
        />
      )}
    </div>
  );
}

function ModuleListItem({ moduleItem, index }: { moduleItem: StudentModule; index: number }) {
  const locked = moduleItem.status === 'locked';

  return (
    <Link
      href={`/student/modules/${moduleItem.id}`}
      className="block rounded-2xl border border-primary/10 bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-soft"
    >
      <div className="grid gap-4 lg:grid-cols-[auto_1fr_auto] lg:items-center">
        <div className="flex items-center gap-4">
          <div
            className={cn(
              'grid h-16 w-16 shrink-0 place-items-center rounded-2xl font-extrabold',
              locked ? 'bg-slate-100 text-slate-400' : 'bg-mint text-primary',
            )}
          >
            {locked ? <Lock className="h-6 w-6" /> : moduleItem.orderIndex ?? index}
          </div>
          <div className="min-w-0 lg:hidden">
            <h2 className="line-clamp-2 font-extrabold text-ink">{moduleItem.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{moduleItem.duration}</p>
          </div>
        </div>

        <div className="min-w-0">
          <div className="hidden lg:block">
            <h2 className="line-clamp-1 text-lg font-extrabold text-ink">{moduleItem.title}</h2>
            <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">{moduleItem.description}</p>
          </div>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground lg:hidden">{moduleItem.description}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-semibold text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <BookOpen className="h-4 w-4 text-primary" />
              {moduleItem.lessonsCount} pelajaran
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-gold" />
              {moduleItem.duration}
            </span>
          </div>
        </div>

        <div className="grid gap-3 lg:w-56">
          <div className="flex items-center justify-between gap-3 lg:justify-end">
            <StatusBadge status={moduleItem.status} />
          </div>
          <ProgressBar value={moduleItem.progress} showValue />
        </div>
      </div>
    </Link>
  );
}
