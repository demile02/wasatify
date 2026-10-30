import { AssignmentBoard } from '@/components/shared/assignment-board';
import { PageHeader } from '@/components/shared/page-header';
import { requireStudent } from '@/lib/auth/server';
import { demoStudentProfile } from '@/lib/demo/student';
import { getStudentAssignmentsData } from '@/lib/student/assignments';

export default async function StudentTasksPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const profile = (await requireStudent()) ?? demoStudentProfile;
  const params = await searchParams;
  const pageParam = Array.isArray(params.page) ? params.page[0] : params.page;
  const parsedPage = Number.parseInt(pageParam ?? '1', 10);
  const page = Number.isSafeInteger(parsedPage) && parsedPage > 0 ? Math.min(parsedPage, 1_000_000) : 1;
  const data = await getStudentAssignmentsData(profile, page);

  return (
    <div>
      <PageHeader eyebrow="Tugas" title="Tugas Pembelajaran" description="Lihat instruksi, kirim jawaban, lalu periksa nilai dan catatan gurumu." />
      <AssignmentBoard mode="student" basePath="/student/tasks" {...data} />
    </div>
  );
}
