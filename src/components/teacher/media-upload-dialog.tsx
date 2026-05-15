'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import type { TeacherMediaModule } from '@/lib/teacher/media';

type MediaUploadDialogProps = {
  teacherId: string;
  modules: TeacherMediaModule[];
};

const bucket = 'media-assets';

export function MediaUploadDialog({ teacherId, modules }: MediaUploadDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [moduleId, setModuleId] = useState('none');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  async function handleUpload() {
    if (!file) {
      toast.warning('Pilih file terlebih dahulu.');
      return;
    }

    setIsUploading(true);

    try {
      const supabase = createClient();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-').replace(/-+/g, '-');
      const path = `teacher/${teacherId}/${Date.now()}-${safeName}`;
      const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(path);
      const fileType = inferUploadFileType(file.type, file.name);
      const { error: insertError } = await supabase.from('media_assets').insert({
        owner_id: teacherId,
        module_id: moduleId === 'none' ? null : moduleId,
        title: title.trim() || file.name,
        bucket,
        path,
        public_url: publicUrlData.publicUrl,
        file_type: fileType,
        mime_type: file.type || null,
        size_bytes: file.size,
        kind: 'lesson_attachment',
      });

      if (insertError) throw insertError;

      toast.success('Media berhasil diunggah.');
      setTitle('');
      setModuleId('none');
      setFile(null);
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Upload media belum berhasil.');
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button">
          <Upload className="h-4 w-4" />
          Upload Media
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-3xl sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-extrabold text-ink">Upload Media</DialogTitle>
          <DialogDescription>File disimpan ke bucket media-assets pada folder milik guru.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <label className="grid gap-2">
            <Label>Judul</Label>
            <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Judul media" />
          </label>
          <label className="grid gap-2">
            <Label>Module terkait</Label>
            <select
              value={moduleId}
              onChange={(event) => setModuleId(event.target.value)}
              className="h-11 rounded-xl border border-border bg-white px-3 text-sm font-semibold outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
            >
              <option value="none">Tidak terkait module</option>
              {modules.map((moduleItem) => (
                <option key={moduleItem.id} value={moduleItem.id}>
                  {moduleItem.title}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 rounded-2xl border border-dashed border-primary/30 bg-mint/30 p-4">
            <Label>File</Label>
            <Input type="file" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
            <span className="text-xs text-muted-foreground">
              Mendukung gambar, video, PDF, dan dokumen sesuai policy bucket Supabase.
            </span>
          </label>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isUploading}>
            Batal
          </Button>
          <Button type="button" onClick={handleUpload} disabled={isUploading}>
            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function inferUploadFileType(mimeType: string | null | undefined, path = '') {
  const mime = mimeType ?? '';
  const lowerPath = path.toLowerCase();

  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime === 'application/pdf' || lowerPath.endsWith('.pdf')) return 'pdf';
  if (mime.includes('word') || mime.includes('presentation') || /\.(docx?|pptx?)$/.test(lowerPath)) return 'document';
  return 'other';
}
