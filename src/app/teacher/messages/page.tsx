import { PageHeader } from '@/components/shared/page-header';
import { TeacherMessagesManager } from '@/components/teacher/teacher-messages-manager';
import { requireTeacher } from '@/lib/auth/server';
import { demoTeacherProfile } from '@/lib/demo/teacher';
import { getTeacherMessagesData } from '@/lib/teacher/messages';

export default async function TeacherMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const profile = (await requireTeacher()) ?? demoTeacherProfile;
  const params = await searchParams;
  const pageValue = Array.isArray(params.page) ? params.page[0] : params.page;
  const parsedPage = Number.parseInt(pageValue ?? '1', 10);
  const page = Number.isSafeInteger(parsedPage) && parsedPage > 0 ? Math.min(parsedPage, 1_000_000) : 1;
  const data = await getTeacherMessagesData(profile, page);

  return (
    <div>
      <PageHeader eyebrow="Komunikasi" title="Pesan" description="Kirim informasi langsung ke kotak pesan siswa di kelasmu." />
      <TeacherMessagesManager data={data} />
    </div>
  );
}
