import { Plus } from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { TeacherModulesTable } from '@/components/teacher/teacher-modules-table';
import { getTeacherModules } from '@/lib/teacher/data';

export default async function TeacherModulesPage() {
  const modules = await getTeacherModules();

  return (
    <div>
      <PageHeader
        eyebrow="Modul Pembelajaran"
        title="Manajemen Modul"
        description="Kelola daftar modul, materi, kategori, status publikasi, dan akses edit modul."
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
