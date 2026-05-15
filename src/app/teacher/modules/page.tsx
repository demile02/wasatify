import { Plus } from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { TeacherModulesTable } from '@/components/teacher/teacher-modules-table';
import { requireTeacher } from '@/lib/auth/server';
import { getTeacherModules } from '@/lib/teacher/data';

export default async function TeacherModulesPage() {
  const profile = await requireTeacher();
  const modules = await getTeacherModules(profile ?? undefined);

  return (
    <div>
      <PageHeader
        eyebrow="Modul Pembelajaran"
        title="Modul Pembelajaran"
        description="Kelola semua modul pembelajaran yang Anda buat."
        actions={
          <Button asChild>
            <Link href="/teacher/modules/new">
              <Plus className="h-4 w-4" />
              Tambah Modul
            </Link>
          </Button>
        }
      />

      <TeacherModulesTable modules={modules} />
    </div>
  );
}
