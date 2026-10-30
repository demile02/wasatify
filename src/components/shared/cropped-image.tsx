'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import type { ImageCropRect } from '@/lib/media/image-crops';
import { canOptimizeImage } from '@/lib/media/image-source';

type CroppedImageProps = {
  src: string;
  crop?: ImageCropRect | null;
  alt?: string;
  sizes?: string;
  loading?: 'eager' | 'lazy';
};

const maximumOutputEdge = 1600;

/** Renders the selected crop as actual pixels while keeping only the original source in storage. */
export function CroppedImage(props: CroppedImageProps) {
  const { src, crop } = props;
  const key = crop ? `${src}:${crop.x}:${crop.y}:${crop.width}:${crop.height}` : src;
  return <CropRenderer key={`${key}:${props.sizes ?? '100vw'}`} {...props} />;
}

function CropRenderer({ src, crop, alt = '', sizes = '100vw', loading }: CroppedImageProps) {
  const [croppedSrc, setCroppedSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [sourceImage, setSourceImage] = useState<HTMLImageElement | null>(null);
  const [selectedCrop] = useState(crop);

  useEffect(() => {
    if (!sourceImage || !selectedCrop) return;
    let cancelled = false;
    let objectUrl: string | null = null;
    void createCroppedWebp(sourceImage, selectedCrop, sizes).then((blob) => {
      if (cancelled) return;
      objectUrl = URL.createObjectURL(blob);
      setCroppedSrc(objectUrl);
    }).catch(() => {
      // Retain the optimized source if canvas access is unavailable.
    });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [sourceImage, selectedCrop, sizes]);

  if (failed) return <span role="img" aria-label={alt || 'Gambar tidak tersedia'} className="absolute inset-0 grid place-items-center bg-mint p-4 text-center text-sm text-primary">Gambar tidak tersedia</span>;

  return (
    <Image
      src={croppedSrc ?? src}
      alt={alt}
      fill
      sizes={sizes}
      loading={loading}
      unoptimized={Boolean(croppedSrc) || !canOptimizeImage(src)}
      onError={() => setFailed(true)}
      onLoad={(event) => {
        if (!croppedSrc) setSourceImage(event.currentTarget);
      }}
      className="object-cover"
      style={{ objectPosition: croppedSrc ? '50% 50%' : getCropObjectPosition(crop) }}
    />
  );
}

function getCropObjectPosition(crop?: ImageCropRect | null) {
  if (!crop) return '50% 50%';
  const x = crop.width < 1 ? crop.x / (1 - crop.width) : 0.5;
  const y = crop.height < 1 ? crop.y / (1 - crop.height) : 0.5;
  return `${clamp(x, 0, 1) * 100}% ${clamp(y, 0, 1) * 100}%`;
}

async function createCroppedWebp(
  image: HTMLImageElement,
  crop: ImageCropRect,
  sizes: string,
) {
  // srcset can density-correct naturalWidth; a bitmap exposes the actual decoded pixel dimensions.
  const bitmap = await createImageBitmap(image);
  try {
    return await new Promise<Blob>((resolve, reject) => {
      const sourceWidth = bitmap.width;
      const sourceHeight = bitmap.height;
      if (!sourceWidth || !sourceHeight) {
        reject(new Error('Image dimensions are unavailable.'));
        return;
      }

      const x = clamp(Math.round(crop.x * sourceWidth), 0, sourceWidth - 1);
      const y = clamp(Math.round(crop.y * sourceHeight), 0, sourceHeight - 1);
      const width = clamp(Math.round(crop.width * sourceWidth), 1, sourceWidth - x);
      const height = clamp(Math.round(crop.height * sourceHeight), 1, sourceHeight - y);
      const deviceScale = Math.min(window.devicePixelRatio || 1, 2);
      const displayEdge = Math.max(image.clientWidth, image.clientHeight, 1);
      const requestedEdge = getRequestedImageEdge(sizes, window.innerWidth);
      const outputEdge = Math.min(maximumOutputEdge, Math.ceil(Math.max(displayEdge, requestedEdge) * deviceScale));
      const scale = Math.min(1, outputEdge / Math.max(width, height));
      const outputWidth = Math.max(1, Math.round(width * scale));
      const outputHeight = Math.max(1, Math.round(height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = outputWidth;
      canvas.height = outputHeight;

      const context = canvas.getContext('2d');
      if (!context) {
        reject(new Error('Canvas is unavailable.'));
        return;
      }

      context.drawImage(bitmap, x, y, width, height, 0, 0, outputWidth, outputHeight);
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas could not encode the crop.'));
      }, 'image/webp', 0.9);
    });
  } finally {
    bitmap.close();
  }
}

function getRequestedImageEdge(sizes: string, viewportWidth: number) {
  const candidates = sizes.split(',').map((candidate) => candidate.trim());

  for (const candidate of candidates) {
    const media = candidate.match(/^\((min|max)-width:\s*(\d+(?:\.\d+)?)px\)\s*(.+)$/);
    if (media) {
      const [, direction, width, length] = media;
      const breakpoint = Number(width);
      const matches = direction === 'min' ? viewportWidth >= breakpoint : viewportWidth <= breakpoint;
      if (matches) return cssLengthToPixels(length, viewportWidth);
      continue;
    }

    return cssLengthToPixels(candidate, viewportWidth);
  }

  return viewportWidth;
}

function cssLengthToPixels(length: string, viewportWidth: number) {
  const match = length.match(/^(\d+(?:\.\d+)?)(vw|px)$/);
  if (!match) return viewportWidth;
  const value = Number(match[1]);
  return match[2] === 'vw' ? (value / 100) * viewportWidth : value;
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.max(minimum, Math.min(value, maximum));
}
