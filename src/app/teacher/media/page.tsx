import { ImageIcon } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { MediaLibrary } from '@/components/teacher/media-library';
import { requireTeacher } from '@/lib/auth/server';
import { demoTeacherProfile } from '@/lib/demo/teacher';
import { getTeacherMediaData } from '@/lib/teacher/media';

export default async function TeacherMediaPage() {
  const profile = (await requireTeacher()) ?? demoTeacherProfile;
  const data = await getTeacherMediaData(profile);

  return (
    <div>
      <PageHeader
        eyebrow="Materi Pendukung"
        title="Materi & Media"
        description="Unggah dan kelola file pendukung pembelajaran."
        actions={
          <div className="hidden h-12 w-12 place-items-center rounded-2xl bg-mint text-primary sm:grid">
            <ImageIcon className="h-5 w-5" />
          </div>
        }
      />
      <MediaLibrary data={data} teacherId={profile.id} />
    </div>
  );
}
