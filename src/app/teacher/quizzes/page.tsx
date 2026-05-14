import { ClipboardCheck } from 'lucide-react';
import { TeacherPlaceholder } from '@/components/teacher/teacher-placeholder';

export default function TeacherQuizzesPage() {
  return (
    <TeacherPlaceholder
      eyebrow="Kuis dan Evaluasi"
      title="Manajemen Kuis"
      description="Buat, edit, dan pantau evaluasi pemahaman untuk modul yang diajarkan."
      icon={ClipboardCheck}
    />
  );
}
