import { PageHeader } from '@/components/shared/page-header';
import { StudentMessagesList } from '@/components/student/student-messages-list';
import { requireStudent } from '@/lib/auth/server';
import { demoStudentProfile } from '@/lib/demo/student';
import { getStudentMessagesData } from '@/lib/student/messages';

export default async function StudentMessagesPage() {
  const profile = (await requireStudent()) ?? demoStudentProfile;
  const messages = await getStudentMessagesData(profile);

  return (
    <div>
      <PageHeader
        eyebrow="Pesan"
        title="Pesan"
        description="Pesan dari guru atau admin akan muncul di sini."
      />
      <StudentMessagesList messages={messages} />
    </div>
  );
}
