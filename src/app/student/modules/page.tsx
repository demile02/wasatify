import { ModuleExplorer } from '@/components/student/module-explorer';
import { PageHeader } from '@/components/shared/page-header';
import { requireStudent } from '@/lib/auth/server';
import { demoStudentProfile } from '@/lib/demo/student';
import { getStudentModules } from '@/lib/student/data';

type StudentModulesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function StudentModulesPage({ searchParams }: StudentModulesPageProps) {
  const query = await searchParams;
  const initialQuery = getSearchValue(query.q);
  const profile = (await requireStudent()) ?? demoStudentProfile;
  const modules = await getStudentModules(profile);

  return (
    <div>
      <PageHeader
        eyebrow="Modul Belajar"
        title="Modul Belajar"
        description="Pilih modul untuk mulai belajar atau lanjutkan perjalanan belajarmu."
      />

      <ModuleExplorer modules={modules} initialQuery={initialQuery} />
    </div>
  );
}

function getSearchValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}
