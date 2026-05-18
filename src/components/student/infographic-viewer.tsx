'use client';

import { useState } from 'react';
import { ArrowLeft, ArrowRight, FileImage } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import type { StudentInfographicAsset } from '@/lib/student/learning';
import { cn } from '@/lib/utils';

type InfographicViewerProps = {
  asset: StudentInfographicAsset;
};

export function InfographicViewer({ asset }: InfographicViewerProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const slides = asset.slideImages;
  const activeSlide = slides[activeIndex];

  if (asset.status === 'pending' || asset.status === 'processing') {
    return (
      <EmptyState
        icon={FileImage}
        title="Infografik sedang diproses"
        description="Slide akan tampil otomatis setelah proses konversi selesai."
      />
    );
  }

  if (asset.status === 'failed') {
    const isPptx =
      asset.sourceFileType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
      asset.errorMessage?.toLowerCase().includes('pptx') ||
      asset.errorMessage?.toLowerCase().includes('worker');

    return (
      <EmptyState
        icon={FileImage}
        title="Infografik gagal diproses"
        description={
          isPptx
            ? 'Konversi PPTX membutuhkan worker/server renderer. Gunakan PDF untuk saat ini.'
            : asset.errorMessage ?? 'File belum bisa dikonversi menjadi gambar slide.'
        }
      />
    );
  }

  if (!activeSlide) {
    return (
      <EmptyState
        icon={FileImage}
        title="Slide belum tersedia"
        description="Infografik sudah diproses, tetapi gambar slide belum ditemukan."
      />
    );
  }

  const canGoPrevious = activeIndex > 0;
  const canGoNext = activeIndex < slides.length - 1;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-card">
      <div className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-bold text-ink">Slide {activeIndex + 1} dari {slides.length}</p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!canGoPrevious}
            onClick={() => setActiveIndex((index) => Math.max(index - 1, 0))}
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={!canGoNext}
            onClick={() => setActiveIndex((index) => Math.min(index + 1, slides.length - 1))}
          >
            Next
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid min-h-[280px] place-items-center bg-slate-50 p-3 sm:p-5">
        {/* eslint-disable-next-line @next/next/no-img-element -- Slide images are already generated in Supabase Storage. */}
        <img
          src={activeSlide.url}
          alt={`Slide infografik ${activeIndex + 1}`}
          className="max-h-[68vh] w-full max-w-full rounded-xl object-contain"
        />
      </div>

      {slides.length > 1 && (
        <div className="flex justify-center gap-1.5 border-t border-border px-4 py-3">
          {slides.map((slide, index) => (
            <button
              key={`${slide.url}-${slide.index}`}
              type="button"
              aria-label={`Buka slide ${index + 1}`}
              onClick={() => setActiveIndex(index)}
              className={cn(
                'h-2.5 rounded-full transition',
                index === activeIndex ? 'w-7 bg-primary' : 'w-2.5 bg-border hover:bg-primary/35',
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
