import { Plus } from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { TeacherModulesTable } from '@/components/teacher/teacher-modules-table';
import { requireTeacher } from '@/lib/auth/server';
import { getTeacherModules } from '@/lib/teacher/data';

export default async function TeacherModulesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const profile = await requireTeacher();
  const params = await searchParams;
  const query = Array.isArray(params.q) ? params.q[0] ?? '' : params.q ?? '';
  const modules = await getTeacherModules(profile ?? undefined);

  return (
    <div>
      <PageHeader
        title="Kelola Modul"
        description="Lihat semua modul yang Anda buat dan status publikasinya."
        actions={
          <Button asChild>
            <Link href="/teacher/modules/new">
              <Plus className="h-4 w-4" />
              Tambah Modul
            </Link>
          </Button>
        }
      />

      <TeacherModulesTable modules={modules} initialQuery={query} />
    </div>
  );
}
