import { Mail } from 'lucide-react';
import { TeacherPlaceholder } from '@/components/teacher/teacher-placeholder';

export default function TeacherMessagesPage() {
  return (
    <TeacherPlaceholder
      eyebrow="Pesan"
      title="Pesan Guru"
      description="Kelola komunikasi dengan siswa dan notifikasi kelas dari satu tempat."
      icon={Mail}
    />
  );
}
