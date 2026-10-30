import { Megaphone } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { AnnouncementsTable } from '@/components/teacher/announcements-table';
import { requireTeacher } from '@/lib/auth/server';
import { demoTeacherProfile } from '@/lib/demo/teacher';
import { getTeacherAnnouncementsData } from '@/lib/teacher/announcements';

export default async function TeacherAnnouncementsPage() {
  const profile = (await requireTeacher()) ?? demoTeacherProfile;
  const data = await getTeacherAnnouncementsData(profile);

  return (
    <div>
      <PageHeader
        eyebrow="Komunikasi"
        title="Pengumuman"
        description="Buat dan kelola informasi penting untuk siswa."
        actions={
          <div className="hidden h-12 w-12 place-items-center rounded-2xl bg-mint text-primary sm:grid">
            <Megaphone className="h-5 w-5" />
          </div>
        }
      />
      <AnnouncementsTable data={data} />
    </div>
  );
}
