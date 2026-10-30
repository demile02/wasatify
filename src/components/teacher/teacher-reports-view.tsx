'use client';

import { useRef, useState } from 'react';
import {
  Activity,
  BarChart3,
  ClipboardCheck,
  Download,
  MessageSquareText,
} from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';
import { SectionCard } from '@/components/shared/section-card';
import { StatCard } from '@/components/shared/stat-card';
import { ExportReportButton } from '@/components/teacher/export-report-button';
import { TeacherReportsChartsLazy } from '@/components/teacher/teacher-reports-charts-lazy';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/date';
import { getTeacherReportScopeAction } from '@/lib/teacher/report-actions';
import type { TeacherReportsData, TeacherReportScope } from '@/lib/teacher/analytics';

type TeacherReportsViewProps = {
  data: TeacherReportsData;
  isDemo?: boolean;
};

export function TeacherReportsView({ data, isDemo = false }: TeacherReportsViewProps) {
  const initialScope = data.scopes[0] ?? emptyScope;
  const [classId, setClassId] = useState(initialScope.classId);
  const [activeScope, setActiveScope] = useState(initialScope);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const requestId = useRef(0);
  const scopeCache = useRef(new Map([[initialScope.classId, initialScope]]));

  async function selectClass(nextClassId: string) {
    setClassId(nextClassId);
    setLoadError('');
    if (isDemo) {
      const nextScope = data.scopes.find((scope) => scope.classId === nextClassId);
      if (nextScope) setActiveScope(nextScope);
      setIsLoading(false);
      return;
    }
    const currentRequest = ++requestId.current;
    const cached = scopeCache.current.get(nextClassId);
    if (cached) {
      setActiveScope(cached);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const scope = await getTeacherReportScopeAction(nextClassId);
      if (currentRequest !== requestId.current) return;
      scopeCache.current.set(nextClassId, scope);
      setActiveScope(scope);
    } catch {
      if (currentRequest !== requestId.current) return;
      setClassId(activeScope.classId);
      setLoadError('Laporan kelas belum dapat dimuat. Coba pilih lagi.');
    } finally {
      if (currentRequest === requestId.current) setIsLoading(false);
    }
  }

  return (
    <div className="min-w-0 overflow-x-hidden">
      <PageHeader
        eyebrow="Laporan"
        title="Laporan dan Analitik"
        description="Analisis progress kelas, nilai kuis, refleksi terkumpul, dan aktivitas belajar siswa."
      />

      <div className="mt-6 grid min-w-0 gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
        <label>
          <span className="mb-2 block text-sm font-bold text-ink">Pilih kelas</span>
          <select
            value={classId}
            onChange={(event) => void selectClass(event.target.value)}
            className="h-12 w-full rounded-xl border border-border bg-white px-4 text-sm font-semibold text-foreground shadow-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 lg:min-w-64"
          >
            <option value="all">Semua Kelas</option>
            {data.classes.map((classItem) => (
              <option key={classItem.id} value={classItem.id}>
                {classItem.name}
              </option>
            ))}
          </select>
        </label>
        {isDemo
          ? <Button type="button" variant="outline" disabled={!activeScope.exportRowCount} onClick={() => downloadDemoReport(activeScope)}><Download className="h-4 w-4" />Unduh CSV</Button>
          : <ExportReportButton classId={classId} disabled={isLoading || activeScope.exportRowCount === 0} />}
      </div>

      {isLoading && <p className="mt-3 text-sm text-muted-foreground" role="status">Memuat laporan kelas...</p>}
      {loadError && <p className="mt-3 text-sm text-red-700" role="alert">{loadError}</p>}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Tingkat Penyelesaian"
          value={`${activeScope.metrics.completionRate}%`}
          description={activeScope.className}
          icon={BarChart3}
        />
        <StatCard
          label="Rata-rata Kuis"
          value={activeScope.metrics.averageQuizScore || '-'}
          description="Skor rata-rata"
          icon={ClipboardCheck}
          tone="gold"
        />
        <StatCard
          label="Refleksi Terkumpul"
          value={activeScope.metrics.reflectionsCount}
          description="Total refleksi"
          icon={MessageSquareText}
          tone="mint"
        />
        <StatCard
          label="Aktivitas Siswa"
          value={activeScope.metrics.activitiesCount}
          description="Progress, kuis, refleksi"
          icon={Activity}
        />
      </div>

      <TeacherReportsChartsLazy activeScope={activeScope} classCompletionData={data.classCompletionData} />

      <div className="mt-6 grid min-w-0 gap-6 xl:grid-cols-2">
        <SectionCard>
          <p className="font-bold text-ink">Penyelesaian Modul</p>
          {activeScope.topModules.length ? (
            <div className="mt-4 max-w-full overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="py-3 pr-4">Modul</th>
                    <th className="px-4 py-3">Penyelesaian</th>
                    <th className="px-4 py-3">Rata-rata Kuis</th>
                    <th className="py-3 pl-4">Percobaan</th>
                  </tr>
                </thead>
                <tbody>
                  {activeScope.topModules.map((moduleItem) => (
                    <tr key={moduleItem.id} className="border-b border-border/70 last:border-0">
                      <td className="py-3 pr-4 font-semibold text-ink">{moduleItem.title}</td>
                      <td className="px-4 py-3">{moduleItem.completionRate}%</td>
                      <td className="px-4 py-3">{moduleItem.attemptsCount ? moduleItem.averageQuizScore : '-'}</td>
                      <td className="py-3 pl-4">{moduleItem.attemptsCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              className="mt-4"
              icon={BarChart3}
              title="Belum ada data modul"
              description="Progress modul akan tampil setelah siswa mulai belajar."
            />
          )}
        </SectionCard>

        <SectionCard>
          <p className="font-bold text-ink">Siswa yang Perlu Pendampingan</p>
          {activeScope.studentsNeedingAttention.length ? (
            <div className="mt-4 max-w-full overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="py-3 pr-4">Siswa</th>
                    <th className="px-4 py-3">Progress</th>
                    <th className="px-4 py-3">Kuis</th>
                    <th className="px-4 py-3">Refleksi</th>
                    <th className="py-3 pl-4">Terakhir Aktif</th>
                  </tr>
                </thead>
                <tbody>
                  {activeScope.studentsNeedingAttention.map((student) => (
                    <tr key={student.id} className="border-b border-border/70 last:border-0">
                      <td className="py-3 pr-4">
                        <p className="font-semibold text-ink">{student.student}</p>
                        <p className="text-xs text-muted-foreground">{student.className}</p>
                      </td>
                      <td className="px-4 py-3">{student.progress}%</td>
                      <td className="px-4 py-3">{student.averageQuizScore || '-'}</td>
                      <td className="px-4 py-3">{student.reflectionCount}</td>
                      <td className="py-3 pl-4 text-muted-foreground">
                        {student.lastActiveAt ? formatDateTime(student.lastActiveAt) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              className="mt-4"
              icon={Activity}
              title="Belum ada siswa yang perlu perhatian khusus"
              description="Daftar ini akan muncul saat ada progress rendah, nilai kuis rendah, atau refleksi belum terkumpul."
            />
          )}
        </SectionCard>
      </div>
    </div>
  );
}

const emptyScope: TeacherReportScope = {
  classId: 'all',
  className: 'Semua Kelas',
  metrics: {
    completionRate: 0,
    averageQuizScore: 0,
    reflectionsCount: 0,
    activitiesCount: 0,
  },
  completionTrend: [],
  quizDistribution: [],
  reflectionRate: [],
  activityRanking: [],
  topModules: [],
  students: [],
  exportRowCount: 0,
  studentsNeedingAttention: [],
};

function downloadDemoReport(scope: TeacherReportScope) {
  const rows = [
    ['Siswa', 'Kelas', 'Progress', 'Nilai kuis rata-rata', 'Refleksi', 'Modul selesai'],
    ...scope.students.map((student) => [student.student, student.className, student.progress, student.averageQuizScore, student.reflectionCount, student.completedModules]),
  ];
  const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `laporan-demo-${scope.classId}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
