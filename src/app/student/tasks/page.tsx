import { ClipboardList } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';

export default function StudentTasksPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Tugas"
        title="Tugas Pembelajaran"
        description="Tugas dari guru akan muncul di halaman ini."
      />
      <EmptyState
        className="mt-8"
        icon={ClipboardList}
        title="Belum ada tugas"
        description="Saat guru memberikan tugas, daftar tugas akan tampil di sini."
      />
    </div>
  );
}
