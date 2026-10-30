'use client';

import { useEffect, useMemo, useState } from 'react';
import { BookOpen, Clock, Lock, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { CroppedImage } from '@/components/shared/cropped-image';
import { EmptyState } from '@/components/shared/empty-state';
import { ProgressBar } from '@/components/shared/progress-bar';
import { StatusBadge } from '@/components/shared/status-badge';
import { moduleStatuses } from '@/lib/constants/design-system';
import type { StudentModule } from '@/lib/demo/student';
import type { ModuleStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

type ModuleExplorerProps = {
  modules: StudentModule[];
  initialQuery?: string;
  basePath?: string;
};

type FilterValue = 'all' | ModuleStatus;

const filters: { label: string; value: FilterValue }[] = [
  { label: 'Semua', value: 'all' },
  { label: moduleStatuses.completed.label, value: 'completed' },
  { label: moduleStatuses.in_progress.label, value: 'in_progress' },
  { label: moduleStatuses.not_started.label, value: 'not_started' },
  { label: moduleStatuses.locked.label, value: 'locked' },
];

export function ModuleExplorer({ modules, initialQuery = '', basePath = '/student' }: ModuleExplorerProps) {
  const [activeFilter, setActiveFilter] = useState<FilterValue>('all');
  const [query, setQuery] = useState(initialQuery);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

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
        description="Kamu belum tergabung dalam kelas, atau guru kelasmu belum mempublikasikan modul."
      />
    );
  }

  return (
    <div className="mt-8">
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {filters.map((filter) => (
          <button
            key={filter.value}
            type="button"
            onClick={() => setActiveFilter(filter.value)}
            aria-controls="module-results"
            aria-pressed={activeFilter === filter.value}
            className={cn(
              'min-h-11 shrink-0 rounded-xl border px-4 py-2.5 text-sm font-bold transition',
              activeFilter === filter.value
                ? 'border-primary bg-primary text-white shadow-card'
                : 'border-border bg-white text-muted-foreground hover:bg-mint hover:text-primary',
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div id="module-results" className="mt-6" role="region" aria-label="Hasil modul">
        {filteredModules.length ? (
          <div className="space-y-4">
            {filteredModules.map((moduleItem, index) => (
              <ModuleListItem key={moduleItem.id} moduleItem={moduleItem} index={index + 1} basePath={basePath} />
            ))}
          </div>
        ) : (
          <EmptyState
            className="mt-2"
            icon={Search}
            title="Modul tidak ditemukan"
            description="Coba ubah kata kunci pencarian atau filter status modul."
          />
        )}
      </div>
    </div>
  );
}

function ModuleListItem({ moduleItem, index, basePath }: { moduleItem: StudentModule; index: number; basePath: string }) {
  const router = useRouter();
  const locked = moduleItem.status === 'locked';
  const ctaLabel = locked ? 'Terkunci' : moduleItem.status === 'in_progress' ? 'Lanjutkan' : 'Buka Modul';

  function openModule() {
    if (locked) {
      toast.warning('Selesaikan modul sebelumnya terlebih dahulu.');
      return;
    }

    router.push(`${basePath}/modules/${moduleItem.slug || moduleItem.id}`);
  }

  return (
    <button
      type="button"
      onClick={openModule}
      aria-disabled={locked}
      className={cn(
        'block w-full rounded-2xl border border-primary/10 bg-white p-4 text-left shadow-card transition',
        locked ? 'cursor-not-allowed opacity-80' : 'hover:-translate-y-0.5 hover:shadow-soft',
      )}
    >
      <div className="grid gap-4 lg:grid-cols-[auto_1fr_auto] lg:items-center">
        <div className="flex items-center gap-4">
          <div
            className={cn(
              'relative grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-mint font-extrabold text-primary',
              locked && !moduleItem.imageSrc && 'bg-slate-100 text-slate-400',
            )}
          >
            {moduleItem.imageSrc && (
              <CroppedImage src={moduleItem.imageSrc} crop={moduleItem.imageCropConfig?.thumbnail} sizes="64px" />
            )}
            <span className="absolute left-1.5 top-1.5 z-20 grid min-h-6 min-w-6 place-items-center rounded-lg bg-white/90 px-1.5 text-xs font-extrabold text-primary shadow-sm">
              {moduleItem.orderIndex ?? index}
            </span>
            {locked && (
              <span className="absolute inset-0 z-10 grid place-items-center bg-slate-950/25">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-white/90 text-slate-500 shadow-sm">
                  <Lock className="h-4 w-4" />
                </span>
              </span>
            )}
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

        <div className="grid gap-3 lg:w-64">
          <div className="flex items-center justify-between gap-3 lg:justify-end">
            <StatusBadge status={moduleItem.status} />
          </div>
          <ProgressBar value={moduleItem.progress} showValue />
          <span
            className={cn(
              'inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-bold',
              locked ? 'bg-muted text-muted-foreground' : 'bg-primary text-primary-foreground',
            )}
          >
            {ctaLabel}
          </span>
        </div>
      </div>
    </button>
  );
}
