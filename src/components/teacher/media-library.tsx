'use client';

import { useMemo, useState } from 'react';
import {
  Copy,
  File,
  FileText,
  ImageIcon,
  Search,
  Trash2,
  Video,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { EmptyState } from '@/components/shared/empty-state';
import { SectionCard } from '@/components/shared/section-card';
import { StatCard } from '@/components/shared/stat-card';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { MediaUploadDialog } from '@/components/teacher/media-upload-dialog';
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

  async function handleCopy(url: string | null) {
    if (!url) {
      toast.warning('URL publik belum tersedia.');
      return;
    }

    await navigator.clipboard.writeText(url);
    toast.success('URL media disalin.');
  }

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
        <div className="grid gap-3 lg:grid-cols-[1fr_220px_auto] lg:items-center">
          <label className="flex min-h-12 items-center gap-2 rounded-xl border border-border bg-white px-4 shadow-sm">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari media atau module..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
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
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredMedia.map((item) => (
              <article key={item.id} className="rounded-2xl border border-border bg-white p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-mint text-primary">
                    <MediaIcon fileType={item.fileType} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-extrabold text-ink">{item.title}</p>
                    <p className="mt-1 text-xs font-semibold uppercase text-primary">{item.fileType}</p>
                    {item.moduleTitle && <p className="mt-1 truncate text-xs text-muted-foreground">{item.moduleTitle}</p>}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <span>{formatSize(item.sizeBytes)}</span>
                  <span className="text-right">{formatDate(item.createdAt)}</span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => handleCopy(item.publicUrl)}>
                    <Copy className="h-4 w-4" />
                    Copy URL
                  </Button>
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

function MediaIcon({ fileType }: { fileType: TeacherMediaFileType }) {
  if (fileType === 'image') return <ImageIcon className="h-5 w-5" />;
  if (fileType === 'video') return <Video className="h-5 w-5" />;
  if (fileType === 'pdf' || fileType === 'document') return <FileText className="h-5 w-5" />;
  return <File className="h-5 w-5" />;
}

function formatSize(value: number | null) {
  if (!value) return '-';
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}
