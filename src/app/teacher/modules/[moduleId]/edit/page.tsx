import Link from 'next/link';
import { ArrowLeft, FileQuestion } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';
import { ModuleEditorForm } from '@/components/teacher/module-editor-form';
import { Button } from '@/components/ui/button';
import { requireTeacher } from '@/lib/auth/server';
import { demoTeacherProfile } from '@/lib/demo/teacher';
import { getModuleEditorData } from '@/lib/teacher/module-editor';

type TeacherEditModulePageProps = {
  params: Promise<{ moduleId: string }>;
};

export default async function TeacherEditModulePage({ params }: TeacherEditModulePageProps) {
  const [{ moduleId }, profile] = await Promise.all([params, requireTeacher()]);
  const teacherProfile = profile ?? demoTeacherProfile;
  const editorData = await getModuleEditorData(teacherProfile, decodeURIComponent(moduleId));

  if (!editorData.module) {
    return (
      <EmptyState
        icon={FileQuestion}
        title="Modul tidak ditemukan"
        description="Modul yang Anda cari belum tersedia atau tidak dapat diakses."
        action={
          <Button asChild>
            <Link href="/teacher/modules">Kembali ke Modul</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Edit Modul"
        title="Edit Modul"
        description={`Perbarui informasi, konten, kuis, dan status publikasi untuk ${editorData.module.title}.`}
        actions={
          <Button asChild variant="outline">
            <Link href="/teacher/modules">
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Link>
          </Button>
        }
      />

      <ModuleEditorForm mode="edit" initialData={editorData.module} classes={editorData.classes} />
    </div>
  );
}
