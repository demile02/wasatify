'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

type TeacherModuleCompletionChartProps = {
  data: {
    id: string;
    title: string;
    completionRate: number;
    completedCount: number;
    studentsCount: number;
  }[];
};

export function TeacherModuleCompletionChart({ data }: TeacherModuleCompletionChartProps) {
  const chartData = data.map((moduleItem) => ({
    name: moduleItem.title.length > 18 ? `${moduleItem.title.slice(0, 18)}...` : moduleItem.title,
    completionRate: moduleItem.completionRate,
    completed: moduleItem.completedCount,
    students: moduleItem.studentsCount,
  }));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 4, left: -24, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} domain={[0, 100]} />
          <Tooltip
            cursor={{ fill: 'hsl(var(--mint) / 0.35)' }}
            contentStyle={{
              borderRadius: 16,
              borderColor: 'hsl(var(--border))',
              boxShadow: '0 14px 35px rgba(15, 23, 42, 0.12)',
            }}
            formatter={(value, name) => [
              name === 'completionRate' ? `${value}%` : value,
              name === 'completionRate' ? 'Penyelesaian' : name,
            ]}
          />
          <Bar dataKey="completionRate" fill="#006B4F" radius={[10, 10, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
