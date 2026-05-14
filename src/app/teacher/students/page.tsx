import { GraduationCap } from 'lucide-react';
import { TeacherPlaceholder } from '@/components/teacher/teacher-placeholder';

export default function TeacherStudentsPage() {
  return (
    <TeacherPlaceholder
      eyebrow="Siswa"
      title="Data Siswa"
      description="Lihat daftar siswa, status belajar, dan ringkasan aktivitas dari kelas yang kamu ajar."
      icon={GraduationCap}
    />
  );
}
