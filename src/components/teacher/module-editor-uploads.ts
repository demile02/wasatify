'use client';

import { toast } from 'sonner';
import { isPptxFile, PPTX_UNSUPPORTED_MESSAGE } from '@/components/teacher/module-editor-infographic';
import type { LessonState } from '@/components/teacher/module-editor-types';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import type { UploadedAssetInput } from '@/lib/teacher/module-actions';

export async function uploadModuleFile(file: File, bucket: 'module-covers' | 'module-media', folder: string): Promise<UploadedAssetInput> {
  if (!isSupabaseConfigured) {
    return {
      bucket,
      path: '',
      publicUrl: URL.createObjectURL(file),
      mimeType: file.type,
      sizeBytes: file.size,
    };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Sesi upload belum aktif. Silakan masuk kembali.');
  }

  const safeName = file.name
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  const path = `${user.id}/${folder}/${Date.now()}-${safeName || 'file'}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });

  if (error) {
    throw new Error(
      error.message.includes('bucket') || error.message.includes('row-level security')
        ? `Upload gagal. Pastikan bucket ${bucket} dan policy storage sudah dibuat.`
        : error.message,
    );
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);

  return {
    bucket,
    path,
    publicUrl: data.publicUrl,
    mimeType: file.type,
    sizeBytes: file.size,
  };
}

type InfographicUploadResult = {
  assetId: string;
  sourceUrl: string;
  status: LessonState['infographicStatus'];
  slideCount: number;
  errorMessage?: string | null;
};

type InfographicSlideImage = {
  index: number;
  url: string;
  path: string;
};

export async function uploadInfographicFile(file: File, moduleId?: string): Promise<InfographicUploadResult> {
  if (isPptxFile(file)) {
    throw new Error(PPTX_UNSUPPORTED_MESSAGE);
  }

  const allowedTypes = [
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/gif',
  ];

  if (!allowedTypes.includes(file.type)) {
    throw new Error('Infografik harus berupa PDF, PNG, JPG, WebP, atau GIF.');
  }

  const sourceAsset = await uploadModuleFile(file, 'module-media', 'infographics');

  if (!isSupabaseConfigured) {
    return {
      assetId: crypto.randomUUID(),
      sourceUrl: sourceAsset.publicUrl,
      status: 'ready',
      slideCount: 1,
    };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Sesi upload belum aktif. Silakan masuk kembali.');

  const { data: asset, error: assetError } = await supabase
    .from('infographic_assets')
    .insert({
      module_id: moduleId ?? null,
      title: file.name,
      source_file_url: sourceAsset.publicUrl,
      source_file_type: file.type,
      processing_status: 'processing',
      created_by: user.id,
    })
    .select('id')
    .single<{ id: string }>();

  if (assetError) {
    throw new Error(
      assetError.message.includes('relation') || assetError.message.includes('row-level security')
        ? 'Gagal membuat metadata infografik. Pastikan schema dan RLS infographic_assets sudah dijalankan.'
        : assetError.message,
    );
  }

  if (file.type.startsWith('image/')) {
    const slideImages = [{ index: 1, url: sourceAsset.publicUrl, path: sourceAsset.path }];
    await updateInfographicAsset(asset.id, {
      processing_status: 'ready',
      slide_count: 1,
      slide_images: slideImages,
      error_message: null,
    });
    return { assetId: asset.id, sourceUrl: sourceAsset.publicUrl, status: 'ready', slideCount: 1 };
  }

  if (file.type === 'application/pdf') {
    try {
      const slideImages = await renderPdfToSlides(file, user.id, asset.id);
      await updateInfographicAsset(asset.id, {
        processing_status: 'ready',
        slide_count: slideImages.length,
        slide_images: slideImages,
        error_message: null,
      });
      return {
        assetId: asset.id,
        sourceUrl: sourceAsset.publicUrl,
        status: 'ready',
        slideCount: slideImages.length,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'PDF gagal diproses menjadi slide.';
      await updateInfographicAsset(asset.id, {
        processing_status: 'failed',
        slide_count: 0,
        slide_images: [],
        error_message: message,
      });
      toast.error(message);
      return { assetId: asset.id, sourceUrl: sourceAsset.publicUrl, status: 'failed', slideCount: 0, errorMessage: message };
    }
  }

  throw new Error('Format infografik belum didukung.');
}

async function updateInfographicAsset(assetId: string, payload: Record<string, unknown>) {
  const supabase = createClient();
  const { error } = await supabase.from('infographic_assets').update(payload).eq('id', assetId);
  if (error) throw error;
}

async function renderPdfToSlides(file: File, userId: string, assetId: string): Promise<InfographicSlideImage[]> {
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).toString();

  const supabase = createClient();
  const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const slideImages: InfographicSlideImage[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1.6 });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Browser tidak mendukung render canvas untuk PDF.');

    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    await page.render({ canvas, canvasContext: context, viewport }).promise;

    const blob = await canvasToBlob(canvas);
    const path = `${userId}/infographic-slides/${assetId}/slide-${pageNumber}.png`;
    const { error } = await supabase.storage.from('module-media').upload(path, blob, {
      cacheControl: '3600',
      contentType: 'image/png',
      upsert: true,
    });

    if (error) throw error;

    const { data } = supabase.storage.from('module-media').getPublicUrl(path);
    slideImages.push({ index: pageNumber, url: data.publicUrl, path });
  }

  return slideImages;
}

function canvasToBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
        return;
      }
      reject(new Error('Gagal membuat gambar slide dari PDF.'));
    }, 'image/png');
  });
}
