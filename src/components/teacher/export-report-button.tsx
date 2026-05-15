'use client';

import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { TeacherReportStudentRow } from '@/lib/teacher/analytics';

type ExportReportButtonProps = {
  rows: TeacherReportStudentRow[];
  fileName?: string;
};

export function ExportReportButton({ rows, fileName = 'wasatify-report.csv' }: ExportReportButtonProps) {
  function handleExport() {
    const headers = ['class', 'student', 'completed_modules', 'average_quiz_score', 'reflection_count', 'last_active_at'];
    const csvRows = [
      headers.join(','),
      ...rows.map((row) =>
        [
          escapeCsv(row.className),
          escapeCsv(row.student),
          row.completedModules,
          row.averageQuizScore,
          row.reflectionCount,
          escapeCsv(row.lastActiveAt ?? ''),
        ].join(','),
      ),
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Button type="button" variant="outline" className="h-12 bg-white" onClick={handleExport} disabled={!rows.length}>
      <Download className="h-4 w-4" />
      Export CSV
    </Button>
  );
}

function escapeCsv(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}
