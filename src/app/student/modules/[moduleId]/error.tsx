'use client';

import Link from 'next/link';
import { AlertCircle } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';

export default function StudentModuleFlowError({ reset }: { reset: () => void }) {
  return (
    <EmptyState
      icon={AlertCircle}
      title="Halaman belajar gagal dimuat"
      description="Ada kendala saat mengambil materi atau kuis. Coba muat ulang halaman ini."
      action={
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button type="button" onClick={reset}>
            Coba Lagi
          </Button>
          <Button asChild variant="outline">
            <Link href="/student/modules">Kembali ke Modul</Link>
          </Button>
        </div>
      }
    />
  );
}
