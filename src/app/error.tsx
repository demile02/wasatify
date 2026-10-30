'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { AlertCircle } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';

export default function PageError({ reset }: { reset: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12">
      <EmptyState
        icon={AlertCircle}
        title="Halaman belum berhasil dimuat"
        description="Periksa koneksi internetmu, lalu coba lagi. Data yang sudah tersimpan tetap aman."
        action={
          <Button disabled={pending} onClick={() => startTransition(() => { router.refresh(); reset(); })}>
            {pending ? 'Memuat ulang...' : 'Coba lagi'}
          </Button>
        }
      />
    </div>
  );
}
