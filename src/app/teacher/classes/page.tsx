import { PageHeader } from '@/components/shared/page-header';
import { ClassesTable } from '@/components/teacher/classes-table';
import { requireTeacher } from '@/lib/auth/server';
import { demoTeacherProfile } from '@/lib/demo/teacher';
import { getTeacherClasses } from '@/lib/teacher/classes';

export default async function TeacherClassesPage() {
  const profile = (await requireTeacher()) ?? demoTeacherProfile;
  const classes = await getTeacherClasses(profile);

  return (
    <div>
      <PageHeader
        eyebrow="Kelas Saya"
        title="Kelas & Peserta"
        description="Kelola kelas dan pantau perkembangan siswa."
      />

      <ClassesTable classes={classes} />
    </div>
  );
}
