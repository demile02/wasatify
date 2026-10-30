'use client';

import { useEffect, useRef, useState } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { ImageCropRect, ModuleImageCropConfig } from '@/lib/media/image-crops';

type CropTarget = keyof ModuleImageCropConfig;
type CropSettings = {
  crop: { x: number; y: number };
  zoom: number;
  pixels: Area | null;
};

export type ModuleCoverCropSource = {
  file: File | null;
  imageUrl: string | null;
  name: string;
};

type ModuleCoverCropDialogProps = {
  source: ModuleCoverCropSource | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (result: { file: File | null; crops: ModuleImageCropConfig }) => void;
};

const cropTargets: Record<CropTarget, { label: string; ratio: number }> = {
  heroDesktop: { label: 'Hero desktop · 4:3', ratio: 4 / 3 },
  heroMobile: { label: 'Hero HP · 16:9', ratio: 16 / 9 },
  thumbnail: { label: 'Thumbnail card · 1:1', ratio: 1 },
};

const initialCropSettings = (): Record<CropTarget, CropSettings> => ({
  heroDesktop: { crop: { x: 0, y: 0 }, zoom: 1, pixels: null },
  heroMobile: { crop: { x: 0, y: 0 }, zoom: 1, pixels: null },
  thumbnail: { crop: { x: 0, y: 0 }, zoom: 1, pixels: null },
});

export function ModuleCoverCropDialog({ source, open, onOpenChange, onApply }: ModuleCoverCropDialogProps) {
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [activeTarget, setActiveTarget] = useState<CropTarget>('heroDesktop');
  const [settings, setSettings] = useState(initialCropSettings);
  const [isProcessing, setIsProcessing] = useState(false);
  const latestCropAreaRef = useRef<Area | null>(null);

  useEffect(() => {
    if (!source || !open) {
      setSourceUrl(null);
      return;
    }

    const objectUrl = source.file ? URL.createObjectURL(source.file) : null;
    const nextUrl = objectUrl ?? source.imageUrl;
    setSourceUrl(nextUrl);
    setActiveTarget('heroDesktop');
    setSettings(initialCropSettings());
    latestCropAreaRef.current = null;
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [source, open]);

  const activeSettings = settings[activeTarget];
  const target = cropTargets[activeTarget];

  function updateActiveSettings(patch: Partial<CropSettings>) {
    setSettings((current) => ({
      ...current,
      [activeTarget]: { ...current[activeTarget], ...patch },
    }));
  }

  function centerActiveCrop(axis: 'x' | 'y') {
    const nextCrop = { ...activeSettings.crop, [axis]: 0 };
    if (nextCrop.x === activeSettings.crop.x && nextCrop.y === activeSettings.crop.y) return;

    const targetToCenter = activeTarget;
    updateActiveSettings({ crop: nextCrop });
    requestAnimationFrame(() => {
      const pixels = latestCropAreaRef.current;
      if (!pixels) return;
      setSettings((current) => ({
        ...current,
        [targetToCenter]: { ...current[targetToCenter], pixels },
      }));
    });
  }

  async function applyCrop() {
    if (!source || !sourceUrl) return;

    const pixels = {
      heroDesktop: settings.heroDesktop.pixels,
      heroMobile: settings.heroMobile.pixels,
      thumbnail: settings.thumbnail.pixels,
    };
    if (!pixels.heroDesktop || !pixels.heroMobile || !pixels.thumbnail) {
      toast.error('Atur crop desktop, HP, dan thumbnail sebelum melanjutkan.');
      return;
    }

    setIsProcessing(true);
    try {
      const image = await loadImage(sourceUrl);
      const crops = {
        heroDesktop: toNormalizedRect(pixels.heroDesktop, image.naturalWidth, image.naturalHeight),
        heroMobile: toNormalizedRect(pixels.heroMobile, image.naturalWidth, image.naturalHeight),
        thumbnail: toNormalizedRect(pixels.thumbnail, image.naturalWidth, image.naturalHeight),
      };
      const file = source.file ? await convertSourceToWebp(source.file, image) : null;
      onApply({ file, crops });
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal memproses gambar.');
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !isProcessing && onOpenChange(nextOpen)}>
      <DialogContent
        className="max-h-[92dvh] overflow-y-auto rounded-3xl sm:max-w-3xl"
        style={{ animation: 'none' }}
      >
        <DialogHeader>
          <DialogTitle>Atur tampilan gambar modul</DialogTitle>
          <DialogDescription>
            Pilih area hero desktop, hero HP, dan thumbnail. Galeri menyimpan satu gambar WebP; saat ditampilkan, sistem membuat potongan piksel sesuai area ini.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid grid-cols-3 gap-2" role="group" aria-label="Tampilan crop">
            {(Object.keys(cropTargets) as CropTarget[]).map((cropTarget) => (
              <button
                key={cropTarget}
                type="button"
                aria-pressed={activeTarget === cropTarget}
                onClick={() => setActiveTarget(cropTarget)}
                className={cropTabClass(activeTarget === cropTarget)}
              >
                {cropTargets[cropTarget].label}
              </button>
            ))}
          </div>

          <div
            className="relative mx-auto w-full max-w-[640px] overflow-hidden rounded-2xl border border-border bg-slate-950"
            style={{ aspectRatio: String(target.ratio) }}
          >
            {sourceUrl && (
              <Cropper
                image={sourceUrl}
                crop={activeSettings.crop}
                zoom={activeSettings.zoom}
                aspect={target.ratio}
                cropShape="rect"
                showGrid
                minZoom={1}
                maxZoom={4}
                objectFit="cover"
                zoomWithScroll={false}
                style={{ mediaStyle: { maxWidth: 'none', maxHeight: 'none' } }}
                onCropChange={(crop) => updateActiveSettings({ crop })}
                onZoomChange={(zoom) => updateActiveSettings({ zoom })}
                onCropAreaChange={(_, area) => { latestCropAreaRef.current = area; }}
                onCropComplete={(_, area) => {
                  latestCropAreaRef.current = area;
                  updateActiveSettings({ pixels: area });
                }}
              />
            )}
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => centerActiveCrop('x')}>
              Tengah horizontal
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => centerActiveCrop('y')}>
              Tengah vertikal
            </Button>
          </div>

          <label className="grid gap-2 rounded-2xl border border-border bg-white p-4">
            <span className="flex items-center justify-between text-sm font-bold text-ink">
              Zoom {target.label}
              <span className="text-xs font-semibold text-muted-foreground">{activeSettings.zoom.toFixed(2)}×</span>
            </span>
            <input
              type="range"
              min={1}
              max={4}
              step={0.05}
              value={activeSettings.zoom}
              onChange={(event) => updateActiveSettings({ zoom: Number(event.target.value) })}
              className="w-full accent-primary"
              aria-label={`Zoom ${target.label}`}
            />
            <span className="text-xs leading-5 text-muted-foreground">
              Geser gambar untuk memilih bagian yang tampil.
            </span>
          </label>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button type="button" variant="outline" disabled={isProcessing} onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button
            type="button"
            disabled={isProcessing || !settings.heroDesktop.pixels || !settings.heroMobile.pixels || !settings.thumbnail.pixels}
            onClick={applyCrop}
          >
            {isProcessing ? 'Mengoptimalkan...' : 'Gunakan Gambar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function cropTabClass(isActive: boolean) {
  return [
    'min-h-11 rounded-xl border px-2 py-2 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 sm:px-3 sm:text-sm',
    isActive ? 'border-primary bg-mint text-primary' : 'border-border bg-white text-muted-foreground hover:bg-mint/40',
  ].join(' ');
}

function toNormalizedRect(pixels: Area, naturalWidth: number, naturalHeight: number): ImageCropRect {
  const x = clamp(pixels.x / naturalWidth, 0, 1);
  const y = clamp(pixels.y / naturalHeight, 0, 1);
  const width = clamp(pixels.width / naturalWidth, 0.00001, 1 - x);
  const height = clamp(pixels.height / naturalHeight, 0.00001, 1 - y);
  return {
    x: roundCropValue(x),
    y: roundCropValue(y),
    width: roundCropValue(width),
    height: roundCropValue(height),
  };
}

function roundCropValue(value: number) {
  return Math.round(value * 1_000_000) / 1_000_000;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => image.naturalWidth && image.naturalHeight
      ? resolve(image)
      : reject(new Error('Gambar tidak memiliki ukuran yang valid.'));
    image.onerror = () => reject(new Error('Gagal membaca gambar untuk crop.'));
    image.src = source;
  });
}

async function convertSourceToWebp(file: File, image: HTMLImageElement) {
  const maximumFileSize = 2 * 1024 * 1024;
  const sourceName = file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9-_]+/g, '-').slice(0, 60) || 'module-cover';
  const edgeLimits = [2400, 2000, 1600, 1280, 1024];
  const qualities = [0.88, 0.82, 0.76, 0.7, 0.64];

  for (const edgeLimit of edgeLimits) {
    const scale = Math.min(1, edgeLimit / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Browser tidak mendukung pemrosesan gambar.');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    for (const quality of qualities) {
      const blob = await canvasToWebp(canvas, quality);
      if (blob.type !== 'image/webp') {
        throw new Error('Browser ini belum mendukung konversi gambar ke WebP.');
      }
      if (blob.size <= maximumFileSize) {
        return new File([blob], `${sourceName}.webp`, { type: 'image/webp' });
      }
    }
  }

  throw new Error('Gambar masih terlalu besar setelah dikompres. Pilih gambar yang lebih kecil.');
}

function canvasToWebp(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Browser gagal membuat file WebP.'));
    }, 'image/webp', quality);
  });
}
