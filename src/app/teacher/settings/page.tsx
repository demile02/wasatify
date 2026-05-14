import { Settings } from 'lucide-react';
import { TeacherPlaceholder } from '@/components/teacher/teacher-placeholder';

export default function TeacherSettingsPage() {
  return (
    <TeacherPlaceholder
      eyebrow="Pengaturan"
      title="Pengaturan Guru"
      description="Kelola profil, preferensi notifikasi, dan konfigurasi workspace mengajar."
      icon={Settings}
    />
  );
}
