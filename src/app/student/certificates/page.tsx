import { Award } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';

export default function StudentCertificatesPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Sertifikat"
        title="Sertifikat Belajar"
        description="Sertifikat akan tersedia setelah kamu menyelesaikan rangkaian pembelajaran."
      />
      <EmptyState
        className="mt-8"
        icon={Award}
        title="Sertifikat belum tersedia"
        description="Selesaikan modul dan kuis untuk membuka sertifikat."
      />
    </div>
  );
}
