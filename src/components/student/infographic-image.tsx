'use client';

import { useState } from 'react';
import { FileImage } from 'lucide-react';
import Image from 'next/image';
import { EmptyState } from '@/components/shared/empty-state';
import { InfographicPdfViewer } from '@/components/student/infographic-pdf-viewer';
import { canOptimizeImage } from '@/lib/media/image-source';
import { cn } from '@/lib/utils';

type Props = {
  src: string;
  alt: string;
  className?: string;
};



function isDocument(src: string) {
  try {
    return /\.(pdf|pptx?|docx?)$/i.test(new URL(src, 'http://localhost').pathname);
  } catch {
    return false;
  }
}

function isPdf(src: string) {
  try {
    return /\.pdf$/i.test(new URL(src, 'http://localhost').pathname);
  } catch {
    return false;
  }
}

export function InfographicImage({ src, alt, className }: Props) {
  return <InfographicImageContent key={src} src={src} alt={alt} className={className} />;
}

function InfographicImageContent({ src, alt, className }: Props) {
  const [failed, setFailed] = useState(false);

  if (isPdf(src)) {
    return <InfographicPdfViewer src={src} title={alt} className={className} />;
  }

  if (isDocument(src) || failed) {
    return (
      <EmptyState
        icon={FileImage}
        title="Infografik tidak dapat ditampilkan"
        description={isDocument(src)
          ? 'Dokumen ini perlu dikonversi menjadi gambar sebelum dapat ditampilkan.'
          : 'Gambar belum dapat dimuat. Coba buka kembali pelajaran ini.'}
        className={className}
      />
    );
  }

  return (
    <div className={cn('relative h-[min(68vh,520px)] w-full', className)}>
      {canOptimizeImage(src) ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1280px) 75vw, 960px"
          className="object-contain"
          onError={() => setFailed(true)}
        />
      ) : (
        // User-supplied external URLs are outside the configured image optimizer host.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} loading="lazy" decoding="async" onError={() => setFailed(true)} className="h-full w-full object-contain" />
      )}
    </div>
  );
}
