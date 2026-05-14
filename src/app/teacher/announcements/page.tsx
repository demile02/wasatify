import { Megaphone } from 'lucide-react';
import { TeacherPlaceholder } from '@/components/teacher/teacher-placeholder';

export default function TeacherAnnouncementsPage() {
  return (
    <TeacherPlaceholder
      eyebrow="Pengumuman"
      title="Manajemen Pengumuman"
      description="Kirim informasi penting, jadwal, atau arahan belajar ke kelas yang kamu ajar."
      icon={Megaphone}
    />
  );
}
