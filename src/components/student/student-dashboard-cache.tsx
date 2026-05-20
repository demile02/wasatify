'use client';

import { useEffect, useState } from 'react';
import { BookOpen, ClipboardCheck, Flame, Trophy } from 'lucide-react';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { ProgressBar } from '@/components/shared/progress-bar';
import { SectionCard } from '@/components/shared/section-card';
import { StatCard } from '@/components/shared/stat-card';

const dashboardCacheKey = 'wasatify:student-dashboard-snapshot';
const cacheMaxAgeMs = 1000 * 60 * 10;

export type StudentDashboardSnapshot = {
  fullName: string;
  modulesCount: number;
  completedCount: number;
  quizAttemptsCount: number;
  streakDays: number;
  points: number;
  activeModuleTitle?: string;
  averageProgress: number;
  updatedAt: string;
};

type StudentDashboardCacheWriterProps = {
  snapshot: StudentDashboardSnapshot;
};

export function StudentDashboardCacheWriter({ snapshot }: StudentDashboardCacheWriterProps) {
  useEffect(() => {
    try {
      window.localStorage.setItem(dashboardCacheKey, JSON.stringify(snapshot));
    } catch {
      // Cache is optional; Supabase remains the source of truth.
    }
  }, [snapshot]);

  return null;
}

export function StudentDashboardCachedLoading() {
  const [snapshot, setSnapshot] = useState<StudentDashboardSnapshot | null>(null);

  useEffect(() => {
    try {
      const rawSnapshot = window.localStorage.getItem(dashboardCacheKey);
      if (!rawSnapshot) return;

      const parsed = JSON.parse(rawSnapshot) as StudentDashboardSnapshot;
      const updatedAt = new Date(parsed.updatedAt).getTime();
      if (!Number.isFinite(updatedAt) || Date.now() - updatedAt > cacheMaxAgeMs) return;

      setSnapshot(parsed);
    } catch {
      window.localStorage.removeItem(dashboardCacheKey);
    }
  }, []);

  if (!snapshot) {
    return <LoadingSpinner />;
  }

  return (
    <div className="animate-pulse">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="h-4 w-32 rounded-full bg-primary/15" />
          <h1 className="mt-4 text-2xl font-extrabold text-ink sm:text-3xl">
            Assalamu&apos;alaikum, {snapshot.fullName}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">Menampilkan ringkasan terakhir sambil memuat data terbaru...</p>
        </div>
        <LoadingSpinner compact className="hidden min-h-0 sm:grid" label="Memuat..." />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Modul Selesai" value={snapshot.completedCount} description={`dari ${snapshot.modulesCount} modul`} icon={BookOpen} />
        <StatCard label="Kuis Dikerjakan" value={snapshot.quizAttemptsCount} description="attempt tercatat" icon={ClipboardCheck} tone="gold" />
        <StatCard label="Streak Belajar" value={`${snapshot.streakDays} hari`} description="belajar konsisten" icon={Flame} />
        <StatCard label="Poin Saya" value={snapshot.points.toLocaleString('id-ID')} description="total poin" icon={Trophy} tone="mint" />
      </div>

      <SectionCard className="mt-6">
        <p className="text-sm font-semibold text-gold">Lanjutkan Belajar</p>
        <h2 className="mt-3 text-2xl font-extrabold text-ink">
          {snapshot.activeModuleTitle ?? 'Memuat modul terbaru...'}
        </h2>
        <ProgressBar value={snapshot.averageProgress} label="Progress Belajar" showValue className="mt-5" />
      </SectionCard>
    </div>
  );
}
