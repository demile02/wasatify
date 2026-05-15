import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/shared/page-header';
import { ModuleEditorForm } from '@/components/teacher/module-editor-form';
import { Button } from '@/components/ui/button';
import { requireTeacher } from '@/lib/auth/server';
import { demoTeacherProfile } from '@/lib/demo/teacher';
import { createEmptyModule, getModuleEditorData } from '@/lib/teacher/module-editor';

export default async function TeacherNewModulePage() {
  const profile = (await requireTeacher()) ?? demoTeacherProfile;
  const editorData = await getModuleEditorData(profile);

  return (
    <div>
      <PageHeader
        eyebrow="Buat Modul"
        title="Buat Modul Baru"
        description="Rancang informasi modul, konten lesson, kuis, dan ringkasan sebelum dipublikasikan."
        actions={
          <Button asChild variant="outline">
            <Link href="/teacher/modules">
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Link>
          </Button>
        }
      />

      <ModuleEditorForm mode="create" initialData={createEmptyModule()} classes={editorData.classes} />
    </div>
  );
}
