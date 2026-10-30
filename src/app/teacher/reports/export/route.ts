import { requireTeacher } from '@/lib/auth/server';
import { formatDateTime } from '@/lib/date';
import { demoTeacherProfile } from '@/lib/demo/teacher';
import { getTeacherReportsData, type TeacherReportStudentRow } from '@/lib/teacher/analytics';

export async function GET(request: Request) {
  const classId = new URL(request.url).searchParams.get('classId') ?? 'all';
  if (classId.length > 80) return new Response('Kelas tidak valid.', { status: 400 });

  const profile = (await requireTeacher()) ?? demoTeacherProfile;
  const data = await getTeacherReportsData(profile, classId, true);
  if (classId !== 'all' && !data.classes.some((classItem) => classItem.id === classId)) {
    return new Response('Kelas tidak ditemukan.', { status: 404 });
  }

  const rows = data.scopes[0].students;
  if (!rows.length) return new Response(null, { status: 204 });

  return new Response(`\uFEFF${makeCsv(rows)}`, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="wasatify-report.csv"',
      'Cache-Control': 'private, no-store',
    },
  });
}

function makeCsv(rows: TeacherReportStudentRow[]) {
  const headers = ['class', 'student', 'completed_modules', 'average_quiz_score', 'reflection_count', 'last_active_at'];
  return [
    headers.join(','),
    ...rows.map((row) => [
      csvCell(row.className),
      csvCell(row.student),
      row.completedModules,
      row.averageQuizScore,
      row.reflectionCount,
      csvCell(row.lastActiveAt ? formatDateTime(row.lastActiveAt) : ''),
    ].join(',')),
  ].join('\n');
}

function csvCell(value: string) {
  const safeValue = /^\s*[=+\-@]/.test(value) ? `'${value}` : value;
  return `"${safeValue.replaceAll('"', '""')}"`;
}
