'use client';

import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import {
  Activity,
  BarChart3,
  ClipboardCheck,
  MessageSquareText,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { EmptyState } from '@/components/shared/empty-state';
import { SectionCard } from '@/components/shared/section-card';
import { StatCard } from '@/components/shared/stat-card';
import { ExportReportButton } from '@/components/teacher/export-report-button';
import type { TeacherReportsData, TeacherReportScope } from '@/lib/teacher/analytics';

type TeacherReportsViewProps = {
  data: TeacherReportsData;
};

export function TeacherReportsView({ data }: TeacherReportsViewProps) {
  const [classId, setClassId] = useState(data.scopes[0]?.classId ?? 'all');
  const activeScope = useMemo(
    () => data.scopes.find((scope) => scope.classId === classId) ?? data.scopes[0] ?? emptyScope,
    [classId, data.scopes],
  );
  const classCompletionData = useMemo(
    () =>
      data.scopes
        .filter((scope) => scope.classId !== 'all')
        .map((scope) => ({ className: scope.className, completion: scope.metrics.completionRate })),
    [data.scopes],
  );

  return (
    <div className="mt-8 min-w-0 overflow-x-hidden">
      <div className="grid min-w-0 gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
        <label>
          <span className="mb-2 block text-sm font-bold text-ink">Filter class</span>
          <select
            value={classId}
            onChange={(event) => setClassId(event.target.value)}
            className="h-12 w-full rounded-xl border border-border bg-white px-4 text-sm font-semibold text-foreground shadow-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 lg:min-w-64"
          >
            {data.scopes.map((scope) => (
              <option key={scope.classId} value={scope.classId}>
                {scope.className}
              </option>
            ))}
          </select>
        </label>
        <ExportReportButton rows={activeScope.students} />
      </div>

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

      <div className="mt-6 grid min-w-0 gap-6 xl:grid-cols-2">
        <ChartCard title="Completion by Class">
          {classCompletionData.length && hasCountData(classCompletionData, 'completion') ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={classCompletionData} margin={{ left: -20, right: 12, top: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="className" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis domain={[0, 100]} tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip />
                <Bar dataKey="completion" fill="#006B4F" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : hasCompletionData(activeScope) ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={activeScope.completionTrend} margin={{ left: -20, right: 12, top: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis domain={[0, 100]} tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip />
                <Line type="monotone" dataKey="completion" stroke="#006B4F" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <ChartEmpty title="Belum ada trend completion" />
          )}
        </ChartCard>

        <ChartCard title="Quiz Average by Module">
          {hasCountData(activeScope.topModules, 'averageQuizScore') ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={activeScope.topModules} margin={{ left: -20, right: 12, top: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="title" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis domain={[0, 100]} tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip />
                <Bar dataKey="averageQuizScore" fill="#C98A1A" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ChartEmpty title="Belum ada distribusi nilai" />
          )}
        </ChartCard>

        <ChartCard title="Reflection Submission Rate">
          {hasCountData(activeScope.reflectionRate, 'reflections') ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={activeScope.reflectionRate} margin={{ left: -20, right: 12, top: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip />
                <Bar dataKey="reflections" fill="#006B4F" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ChartEmpty title="Belum ada refleksi terkumpul" />
          )}
        </ChartCard>

        <ChartCard title="Activity Ranking">
          {hasCountData(activeScope.activityRanking, 'activities') ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={activeScope.activityRanking}
                layout="vertical"
                margin={{ left: 10, right: 12, top: 10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
                <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} fontSize={12} width={86} />
                <Tooltip />
                <Bar dataKey="activities" fill="#00483A" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ChartEmpty title="Belum ada ranking aktivitas" />
          )}
        </ChartCard>
      </div>

      <div className="mt-6 grid min-w-0 gap-6 xl:grid-cols-2">
        <SectionCard>
          <p className="font-bold text-ink">Top Modules by Completion</p>
          {activeScope.topModules.length ? (
            <div className="mt-4 max-w-full overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="py-3 pr-4">Modul</th>
                    <th className="px-4 py-3">Completion</th>
                    <th className="px-4 py-3">Rata-rata Kuis</th>
                    <th className="py-3 pl-4">Attempts</th>
                  </tr>
                </thead>
                <tbody>
                  {activeScope.topModules.map((moduleItem) => (
                    <tr key={moduleItem.id} className="border-b border-border/70 last:border-0">
                      <td className="py-3 pr-4 font-semibold text-ink">{moduleItem.title}</td>
                      <td className="px-4 py-3">{moduleItem.completionRate}%</td>
                      <td className="px-4 py-3">{moduleItem.averageQuizScore || '-'}</td>
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
              description="Completion modul akan tampil setelah siswa mulai belajar."
            />
          )}
        </SectionCard>

        <SectionCard>
          <p className="font-bold text-ink">Students Needing Attention</p>
          {activeScope.studentsNeedingAttention.length ? (
            <div className="mt-4 max-w-full overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="py-3 pr-4">Siswa</th>
                    <th className="px-4 py-3">Progress</th>
                    <th className="px-4 py-3">Kuis</th>
                    <th className="py-3 pl-4">Refleksi</th>
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
                      <td className="py-3 pl-4">{student.reflectionCount}</td>
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

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <SectionCard>
      <p className="font-bold text-ink">{title}</p>
      <div className="mt-5 h-[280px] min-w-0">{children}</div>
    </SectionCard>
  );
}

function ChartEmpty({ title }: { title: string }) {
  return (
    <EmptyState
      className="min-h-[280px]"
      icon={BarChart3}
      title={title}
      description="Data chart akan tampil setelah aktivitas siswa tercatat di Supabase."
    />
  );
}

function hasCompletionData(scope: TeacherReportScope) {
  return scope.completionTrend.some((item) => item.completion > 0);
}

function hasCountData<T extends Record<string, unknown>>(items: T[], key: keyof T) {
  return items.some((item) => Number(item[key] ?? 0) > 0);
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
  studentsNeedingAttention: [],
};
