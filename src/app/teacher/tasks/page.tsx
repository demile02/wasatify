import { AssignmentBoard } from '@/components/shared/assignment-board';
import { PageHeader } from '@/components/shared/page-header';
import { requireTeacher } from '@/lib/auth/server';
import { demoTeacherProfile } from '@/lib/demo/teacher';
import { getTeacherAssignmentsData } from '@/lib/teacher/assignments';

export default async function TeacherTasksPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const profile = (await requireTeacher()) ?? demoTeacherProfile;
  const params = await searchParams;
  const pageParam = Array.isArray(params.page) ? params.page[0] : params.page;
  const parsedPage = Number.parseInt(pageParam ?? '1', 10);
  const page = Number.isSafeInteger(parsedPage) && parsedPage > 0 ? Math.min(parsedPage, 1_000_000) : 1;
  const data = await getTeacherAssignmentsData(profile, page);

  return (
    <div>
      <PageHeader eyebrow="Tugas" title="Tugas Kelas" description="Bagikan tugas ke kelas, lalu periksa jawaban dan nilai siswa." />
      <AssignmentBoard mode="teacher" basePath="/teacher/tasks" {...data} />
    </div>
  );
}
