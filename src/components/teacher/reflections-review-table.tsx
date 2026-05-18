'use client';

import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { CalendarClock, CheckCircle2, MessageSquareText, Search, UserCheck } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { SectionCard } from '@/components/shared/section-card';
import { StatCard } from '@/components/shared/stat-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { ReflectionReviewDialog } from '@/components/teacher/reflection-review-dialog';
import type { TeacherReflectionItem, TeacherReflectionsData } from '@/lib/teacher/reflections';

type ReflectionsReviewTableProps = {
  data: TeacherReflectionsData;
};

type ReviewStatus = 'all' | 'pending' | 'reviewed';

export function ReflectionsReviewTable({ data }: ReflectionsReviewTableProps) {
  const [query, setQuery] = useState('');
  const [classId, setClassId] = useState('all');
  const [moduleId, setModuleId] = useState('all');
  const [status, setStatus] = useState<ReviewStatus>('all');
  const [selectedReflection, setSelectedReflection] = useState<TeacherReflectionItem | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (classId !== 'all' && !data.classes.some((classItem) => classItem.id === classId)) {
      setClassId('all');
    }

    if (moduleId !== 'all' && !data.modules.some((moduleItem) => moduleItem.id === moduleId)) {
      setModuleId('all');
    }
  }, [classId, data.classes, data.modules, moduleId]);

  const filteredReflections = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return data.reflections.filter((reflection) => {
      const matchesQuery =
        !normalizedQuery ||
        reflection.studentName.toLowerCase().includes(normalizedQuery) ||
        reflection.reflectionText.toLowerCase().includes(normalizedQuery) ||
        (reflection.actionPlan?.toLowerCase().includes(normalizedQuery) ?? false) ||
        reflection.moduleTitle.toLowerCase().includes(normalizedQuery);
      const matchesClass = classId === 'all' || reflection.classId === classId;
      const matchesModule = moduleId === 'all' || reflection.moduleId === moduleId;
      const matchesStatus =
        status === 'all' || (status === 'reviewed' && reflection.reviewedAt) || (status === 'pending' && !reflection.reviewedAt);

      return matchesQuery && matchesClass && matchesModule && matchesStatus;
    });
  }, [classId, data.reflections, moduleId, query, status]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    searchRef.current?.blur();
  }

  return (
    <div className="mt-8 space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Refleksi" value={data.summary.total} icon={MessageSquareText} />
        <StatCard label="Belum Ditinjau" value={data.summary.pending} icon={CalendarClock} tone="gold" />
        <StatCard label="Sudah Ditinjau" value={data.summary.reviewed} icon={UserCheck} tone="mint" />
        <StatCard label="Refleksi Minggu Ini" value={data.summary.thisWeek} icon={CheckCircle2} />
      </div>

      <SectionCard className="space-y-4">
        <div className="grid gap-3 xl:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <form onSubmit={submitSearch} className="flex min-h-12 items-center gap-2 rounded-xl border border-border bg-white px-4 shadow-sm">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              ref={searchRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari siswa, modul, atau isi refleksi..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
            />
          </form>

          <FilterSelect value={classId} onChange={setClassId} label="Semua Kelas" disabled={!data.classes.length}>
            {data.classes.map((classItem) => (
              <option key={classItem.id} value={classItem.id}>
                {classItem.label}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect value={moduleId} onChange={setModuleId} label="Semua Modul" disabled={!data.modules.length}>
            {data.modules.map((moduleItem) => (
              <option key={moduleItem.id} value={moduleItem.id}>
                {moduleItem.label}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect value={status} onChange={(value) => setStatus(value as ReviewStatus)} label="Semua Status">
            <option value="pending">Belum Ditinjau</option>
            <option value="reviewed">Sudah Ditinjau</option>
          </FilterSelect>
        </div>

        {filteredReflections.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-3 pr-4">Siswa</th>
                  <th className="px-4 py-3">Modul</th>
                  <th className="px-4 py-3">Refleksi</th>
                  <th className="px-4 py-3">Aksi Nyata</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="py-3 pl-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredReflections.map((reflection) => (
                  <tr key={reflection.id} className="border-b border-border/70 last:border-0">
                    <td className="py-4 pr-4 align-top">
                      <p className="font-bold text-ink">{reflection.studentName}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{reflection.className}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{formatDate(reflection.createdAt)}</p>
                    </td>
                    <td className="px-4 py-4 align-top font-semibold text-foreground">{reflection.moduleTitle}</td>
                    <td className="px-4 py-4 align-top text-muted-foreground">{truncate(reflection.reflectionText, 120)}</td>
                    <td className="px-4 py-4 align-top text-muted-foreground">
                      {truncate(reflection.actionPlan || 'Belum ada aksi nyata.', 100)}
                    </td>
                    <td className="px-4 py-4 align-top">
                      <StatusBadge
                        status={reflection.reviewedAt ? 'completed' : 'in_progress'}
                        label={reflection.reviewedAt ? 'Sudah Ditinjau' : 'Belum Ditinjau'}
                      />
                    </td>
                    <td className="py-4 pl-4 text-right align-top">
                      <Button type="button" size="sm" variant="outline" onClick={() => setSelectedReflection(reflection)}>
                        Tinjau
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={MessageSquareText}
            title={data.reflections.length ? 'Refleksi tidak ditemukan' : 'Belum ada refleksi siswa'}
            description={
              data.reflections.length
                ? 'Coba ubah filter kelas, modul, status, atau kata kunci pencarian.'
                : 'Refleksi siswa akan tampil di sini setelah mereka menyimpan refleksi dari modul belajar.'
            }
          />
        )}
      </SectionCard>

      <ReflectionReviewDialog
        reflection={selectedReflection}
        open={Boolean(selectedReflection)}
        onOpenChange={(open) => {
          if (!open) setSelectedReflection(null);
        }}
      />
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  label,
  children,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      disabled={disabled}
      className="h-12 w-full rounded-xl border border-border bg-white px-4 text-sm font-semibold text-foreground shadow-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-muted-foreground"
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
