import { Mail } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';

export default function StudentMessagesPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Pesan"
        title="Pesan"
        description="Pesan dari guru atau admin akan muncul di sini."
      />
      <EmptyState
        className="mt-8"
        icon={Mail}
        title="Belum ada pesan"
        description="Kotak pesan masih kosong untuk saat ini."
      />
    </div>
  );
}
