import { Users } from 'lucide-react';
import { TeacherPlaceholder } from '@/components/teacher/teacher-placeholder';

export default function TeacherClassesPage() {
  return (
    <TeacherPlaceholder
      eyebrow="Kelas Saya"
      title="Manajemen Kelas"
      description="Pantau kelas aktif, jumlah siswa, progress kolektif, dan akses detail setiap kelas."
      icon={Users}
    />
  );
}
