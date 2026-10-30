import { PageHeader } from '@/components/shared/page-header';
import { StudentMessagesList } from '@/components/student/student-messages-list';
import { requireStudent } from '@/lib/auth/server';
import { demoStudentProfile } from '@/lib/demo/student';
import { getStudentMessagesData } from '@/lib/student/messages';

export default async function StudentMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const profile = (await requireStudent()) ?? demoStudentProfile;
  const params = await searchParams;
  const pageParam = Array.isArray(params.page) ? params.page[0] : params.page;
  const parsedPage = Number.parseInt(pageParam ?? '1', 10);
  const page = Number.isSafeInteger(parsedPage) && parsedPage > 0 ? Math.min(parsedPage, 1_000_000) : 1;
  const messagePage = await getStudentMessagesData(profile, page);

  return (
    <div>
      <PageHeader
        eyebrow="Pesan"
        title="Pesan"
        description="Pesan dari guru atau admin akan muncul di sini."
      />
      <StudentMessagesList {...messagePage} />
    </div>
  );
}
