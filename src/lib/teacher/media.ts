import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import type { Profile } from '@/lib/types';

export type TeacherMediaFileType = 'image' | 'video' | 'pdf' | 'document' | 'other';

export type TeacherMediaModule = {
  id: string;
  title: string;
};

export type TeacherMediaItem = {
  id: string;
  title: string;
  fileType: TeacherMediaFileType;
  mimeType: string | null;
  sizeBytes: number | null;
  bucket: string;
  path: string;
  publicUrl: string | null;
  moduleId: string | null;
  moduleTitle: string | null;
  createdAt: string;
};

export type TeacherMediaData = {
  media: TeacherMediaItem[];
  modules: TeacherMediaModule[];
  summary: {
    total: number;
    image: number;
    video: number;
    document: number;
  };
};

type MediaRow = {
  id: string;
  title: string | null;
  file_type: TeacherMediaFileType | null;
  mime_type: string | null;
  size_bytes: number | null;
  bucket: string;
  path: string;
  public_url: string | null;
  module_id: string | null;
  created_at: string;
};

type ModuleRow = {
  id: string;
  title: string;
};

export async function getTeacherMediaData(profile: Profile): Promise<TeacherMediaData> {
  if (!isSupabaseConfigured) return emptyMediaData();

  try {
    const supabase = await createClient();
    let mediaQuery = supabase
      .from('media_assets')
      .select('id, title, file_type, mime_type, size_bytes, bucket, path, public_url, module_id, created_at')
      .order('created_at', { ascending: false });
    let moduleQuery = supabase.from('modules').select('id, title').order('title', { ascending: true });

    if (profile.role !== 'admin') {
      mediaQuery = mediaQuery.eq('owner_id', profile.id);
      moduleQuery = moduleQuery.eq('created_by', profile.id);
    }

    const [mediaResult, modulesResult] = await Promise.all([mediaQuery, moduleQuery]);
    if (mediaResult.error || modulesResult.error) throw mediaResult.error ?? modulesResult.error;

    const modules = (modulesResult.data ?? []) as ModuleRow[];
    const moduleById = new Map(modules.map((moduleItem) => [moduleItem.id, moduleItem]));
    const media = ((mediaResult.data ?? []) as MediaRow[]).map((item) => {
      const fileType = item.file_type ?? inferFileType(item.mime_type, item.path);

      return {
        id: item.id,
        title: item.title || fileNameFromPath(item.path),
        fileType,
        mimeType: item.mime_type,
        sizeBytes: item.size_bytes,
        bucket: item.bucket,
        path: item.path,
        publicUrl: item.public_url,
        moduleId: item.module_id,
        moduleTitle: item.module_id ? moduleById.get(item.module_id)?.title ?? null : null,
        createdAt: item.created_at,
      };
    });

    return {
      modules,
      media,
      summary: {
        total: media.length,
        image: media.filter((item) => item.fileType === 'image').length,
        video: media.filter((item) => item.fileType === 'video').length,
        document: media.filter((item) => ['pdf', 'document'].includes(item.fileType)).length,
      },
    };
  } catch {
    return emptyMediaData();
  }
}

export function inferFileType(mimeType: string | null | undefined, path = ''): TeacherMediaFileType {
  const mime = mimeType ?? '';
  const lowerPath = path.toLowerCase();

  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime === 'application/pdf' || lowerPath.endsWith('.pdf')) return 'pdf';
  if (mime.includes('word') || mime.includes('presentation') || /\.(docx?|pptx?)$/.test(lowerPath)) return 'document';
  return 'other';
}

function fileNameFromPath(path: string) {
  return path.split('/').pop() ?? 'Media';
}

function emptyMediaData(): TeacherMediaData {
  return {
    media: [],
    modules: [],
    summary: {
      total: 0,
      image: 0,
      video: 0,
      document: 0,
    },
  };
}
