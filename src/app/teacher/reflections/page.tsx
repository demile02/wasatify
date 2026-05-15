import { MessageSquareText } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { ReflectionsReviewTable } from '@/components/teacher/reflections-review-table';
import { requireTeacher } from '@/lib/auth/server';
import { demoTeacherProfile } from '@/lib/demo/teacher';
import { getTeacherReflectionsData } from '@/lib/teacher/reflections';

export default async function TeacherReflectionsPage() {
  const profile = (await requireTeacher()) ?? demoTeacherProfile;
  const data = await getTeacherReflectionsData(profile);

  return (
    <div>
      <PageHeader
        eyebrow="Review Guru"
        title="Refleksi Siswa"
        description="Tinjau refleksi dan aksi nyata siswa setelah menyelesaikan modul."
        actions={
          <div className="hidden h-12 w-12 place-items-center rounded-2xl bg-mint text-primary sm:grid">
            <MessageSquareText className="h-5 w-5" />
          </div>
        }
      />
      <ReflectionsReviewTable data={data} />
    </div>
  );
}
