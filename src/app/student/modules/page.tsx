import { ModuleExplorer } from '@/components/student/module-explorer';
import { PageHeader } from '@/components/shared/page-header';
import { requireStudent } from '@/lib/auth/server';
import { demoStudentProfile } from '@/lib/demo/student';
import { getStudentModules } from '@/lib/student/data';

export default async function StudentModulesPage() {
  const profile = (await requireStudent()) ?? demoStudentProfile;
  const modules = await getStudentModules(profile);

  return (
    <div>
      <PageHeader
        eyebrow="Modul Belajar"
        title="Modul Belajar"
        description="Pilih modul untuk mulai belajar atau lanjutkan perjalanan belajarmu."
      />

      <ModuleExplorer modules={modules} />
    </div>
  );
}
