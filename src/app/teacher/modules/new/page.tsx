import { PageHeader } from '@/components/shared/page-header';
import { ModuleEditorForm } from '@/components/teacher/module-editor-form';
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
      />

      <ModuleEditorForm mode="create" initialData={createEmptyModule()} classes={editorData.classes} />
    </div>
  );
}
