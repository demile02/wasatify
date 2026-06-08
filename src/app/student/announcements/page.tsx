import { PageHeader } from '@/components/shared/page-header';
import { StudentAnnouncementsList } from '@/components/student/student-announcements-list';
import { requireStudent } from '@/lib/auth/server';
import { demoStudentProfile } from '@/lib/demo/student';
import { getStudentAnnouncementsData } from '@/lib/student/announcements';

export default async function StudentAnnouncementsPage() {
  const profile = (await requireStudent()) ?? demoStudentProfile;
  const announcements = await getStudentAnnouncementsData(profile);

  return (
    <div>
      <PageHeader
        eyebrow="Pengumuman"
        title="Pengumuman Kelas"
        description="Informasi terbaru dari guru dan platform WASATIFY."
      />
      <StudentAnnouncementsList announcements={announcements} />
    </div>
  );
}
