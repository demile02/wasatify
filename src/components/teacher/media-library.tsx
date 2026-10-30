'use client';

import { useMemo, useState } from 'react';
import {
  File,
  FileText,
  ImageIcon,
  Search,
  Trash2,
  Video,
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { EmptyState } from '@/components/shared/empty-state';
import { SectionCard } from '@/components/shared/section-card';
import { StatCard } from '@/components/shared/stat-card';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { MediaUploadDialog } from '@/components/teacher/media-upload-dialog';
import { formatDateTime } from '@/lib/date';
import type { TeacherMediaData, TeacherMediaFileType, TeacherMediaItem } from '@/lib/teacher/media';

type MediaLibraryProps = {
  data: TeacherMediaData;
  teacherId: string;
};

export function MediaLibrary({ data, teacherId }: MediaLibraryProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [fileType, setFileType] = useState('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredMedia = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return data.media.filter((item) => {
      const matchesQuery =
        !normalizedQuery ||
        item.title.toLowerCase().includes(normalizedQuery) ||
        (item.moduleTitle?.toLowerCase().includes(normalizedQuery) ?? false);
      const matchesType = fileType === 'all' || item.fileType === fileType;

      return matchesQuery && matchesType;
    });
  }, [data.media, fileType, query]);

  async function handleDelete(item: TeacherMediaItem) {
    if (!window.confirm('Hapus media ini dari Storage dan library? Aksi ini tidak bisa dibatalkan.')) return;

    setDeletingId(item.id);

    try {
      const supabase = createClient();
      const { error: storageError } = await supabase.storage.from(item.bucket).remove([item.path]);
      if (storageError) throw storageError;

      const { error: rowError } = await supabase.from('media_assets').delete().eq('id', item.id);
      if (rowError) throw rowError;

      toast.success('Media dihapus.');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Media belum berhasil dihapus.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="mt-8 space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total File" value={data.summary.total} icon={File} />
        <StatCard label="Gambar" value={data.summary.image} icon={ImageIcon} tone="mint" />
        <StatCard label="Video" value={data.summary.video} icon={Video} />
        <StatCard label="Dokumen" value={data.summary.document} icon={FileText} tone="gold" />
      </div>

      <SectionCard className="space-y-4">
        <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1fr)_220px_auto] lg:items-center">
          <label className="flex min-h-12 min-w-0 items-center gap-2 rounded-xl border border-border bg-white px-4 shadow-sm">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari media atau module..."
              className="min-w-0 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
            />
          </label>
          <select
            value={fileType}
            onChange={(event) => setFileType(event.target.value)}
            className="h-12 w-full rounded-xl border border-border bg-white px-4 text-sm font-semibold text-foreground shadow-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
          >
            <option value="all">Semua Type</option>
            <option value="image">Image</option>
            <option value="video">Video</option>
            <option value="pdf">PDF</option>
            <option value="document">Document</option>
            <option value="other">Other</option>
          </select>
          <MediaUploadDialog teacherId={teacherId} modules={data.modules} />
        </div>

        {filteredMedia.length ? (
          <div className="grid min-w-0 w-full gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredMedia.map((item) => (
              <article key={item.id} className="min-w-0 max-w-full rounded-2xl border border-border bg-white p-4 shadow-sm">
                <div className="flex min-w-0 items-start gap-3">
                  <MediaThumbnail item={item} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-extrabold text-ink">{item.title}</p>
                    <p className="mt-1 text-xs font-semibold uppercase text-primary">{item.fileType}</p>
                    {item.moduleTitle && <p className="mt-1 truncate text-xs text-muted-foreground">{item.moduleTitle}</p>}
                  </div>
                </div>

                <div className="mt-4 grid min-w-0 grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <span className="min-w-0 break-words">{formatSize(item.sizeBytes)}</span>
                  <span className="min-w-0 break-words text-right">{formatDateTime(item.createdAt)}</span>
                </div>

                <div className="mt-4 flex min-w-0 flex-wrap gap-2">
                  {item.publicUrl && (
                    <Button asChild size="sm" variant="outline">
                      <a href={item.publicUrl} target="_blank" rel="noreferrer">
                        Buka
                      </a>
                    </Button>
                  )}
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    disabled={deletingId === item.id}
                    onClick={() => handleDelete(item)}
                    aria-label="Hapus media"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={ImageIcon}
            title={data.media.length ? 'Media tidak ditemukan' : 'Belum ada media'}
            description={
              data.media.length
                ? 'Coba ubah kata kunci atau filter type file.'
                : 'Unggah file pendukung seperti gambar, video, PDF, atau dokumen untuk dipakai pada pembelajaran.'
            }
            action={!data.media.length ? <MediaUploadDialog teacherId={teacherId} modules={data.modules} /> : undefined}
          />
        )}
      </SectionCard>
    </div>
  );
}

function MediaThumbnail({ item }: { item: TeacherMediaItem }) {
  const [imageFailed, setImageFailed] = useState(false);

  if (item.fileType === 'image' && item.publicUrl && !imageFailed) {
    return (
      <div className="relative aspect-[4/3] w-24 shrink-0 overflow-hidden rounded-xl bg-mint sm:w-28">
        <Image
          src={item.publicUrl}
          alt=""
          fill
          sizes="(max-width: 639px) 96px, 112px"
          loading="lazy"
          className="object-cover"
          onError={() => setImageFailed(true)}
        />
      </div>
    );
  }

  return (
    <div className="grid aspect-[4/3] w-24 shrink-0 place-content-center justify-items-center gap-2 rounded-xl border border-primary/10 bg-mint/60 text-primary sm:w-28">
      <MediaIcon fileType={item.fileType} />
      <span className="max-w-full truncate rounded-md bg-white/80 px-2 py-1 text-[10px] font-bold uppercase tracking-wide">
        {getMediaLabel(item)}
      </span>
    </div>
  );
}

function MediaIcon({ fileType }: { fileType: TeacherMediaFileType }) {
  if (fileType === 'image') return <ImageIcon className="h-5 w-5" />;
  if (fileType === 'video') return <Video className="h-5 w-5" />;
  if (fileType === 'pdf' || fileType === 'document') return <FileText className="h-5 w-5" />;
  return <File className="h-5 w-5" />;
}

function getMediaLabel(item: TeacherMediaItem) {
  if (item.fileType === 'image') return 'Gambar';
  if (item.fileType === 'video') return 'Video';
  if (item.fileType === 'pdf') return 'PDF';
  if (item.fileType === 'document') return 'Dokumen';

  const extension = item.title.split('.').pop();
  return extension && extension !== item.title ? extension : 'File';
}

function formatSize(value: number | null) {
  if (!value) return '-';
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}
