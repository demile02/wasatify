'use client';

import type { ReactNode } from 'react';
import { BarChart3 } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { EmptyState } from '@/components/shared/empty-state';
import { SectionCard } from '@/components/shared/section-card';
import type { TeacherReportScope } from '@/lib/teacher/analytics';

export function TeacherReportsCharts({
  activeScope,
  classCompletionData,
}: {
  activeScope: TeacherReportScope;
  classCompletionData: { className: string; completion: number }[];
}) {
  return (
      <div className="mt-6 grid min-w-0 gap-6 xl:grid-cols-2">
        <ChartCard title="Progress per Kelas">
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
            <ChartEmpty title="Belum ada progress belajar" />
          )}
        </ChartCard>

        <ChartCard title="Rata-rata Kuis per Modul">
          {hasCountData(activeScope.topModules, 'attemptsCount') ? (
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

        <ChartCard title="Refleksi Terkumpul">
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

        <ChartCard title="Peringkat Aktivitas">
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
            <ChartEmpty title="Belum ada aktivitas siswa" />
          )}
        </ChartCard>
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
      description="Grafik akan tampil setelah siswa mulai belajar."
    />
  );
}

function hasCompletionData(scope: TeacherReportScope) {
  return scope.completionTrend.some((item) => item.completion > 0);
}

function hasCountData<T extends Record<string, unknown>>(items: T[], key: keyof T) {
  return items.some((item) => Number(item[key] ?? 0) > 0);
}

