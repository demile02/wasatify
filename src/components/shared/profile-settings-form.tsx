'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Camera, Trash2, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { SectionCard } from '@/components/shared/section-card';
import { UserAvatar } from '@/components/shared/user-avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/lib/types';

type ProfileSettingsFormProps = {
  profile: Profile;
  roleLabel: 'Siswa' | 'Guru' | 'Admin';
  roleDescription?: string;
};

const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
const hardMaxAvatarSize = 20 * 1024 * 1024;
const targetAvatarSize = 1.9 * 1024 * 1024;
const avatarCanvasSizes = [1024, 900, 800, 700, 600];
const webpMime = 'image/webp';

type CropState = {
  zoom: number;
  offsetX: number;
  offsetY: number;
};

export function ProfileSettingsForm({ profile, roleLabel, roleDescription }: ProfileSettingsFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cropImageRef = useRef<HTMLImageElement>(null);
  const [fullName, setFullName] = useState(profile.full_name);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [cropSourceUrl, setCropSourceUrl] = useState<string | null>(null);
  const [cropSourceName, setCropSourceName] = useState('avatar');
  const [cropState, setCropState] = useState<CropState>({ zoom: 1, offsetX: 0, offsetY: 0 });
  const [isCropDialogOpen, setIsCropDialogOpen] = useState(false);
  const [isCropping, setIsCropping] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const currentPreview = previewUrl ?? avatarUrl;
  const canSave = fullName.trim().length >= 2 || selectedFile;
  const hasChanges = fullName.trim() !== profile.full_name || Boolean(selectedFile);

  const detailRows = useMemo(
    () => [
      { label: 'Role', value: roleDescription ?? roleLabel },
      { label: 'Email', value: profile.email ?? '-' },
      { label: roleLabel === 'Siswa' ? 'Kelas' : 'Instansi/Mapel', value: profile.class_name ?? profile.subject ?? profile.school_name ?? '-' },
    ],
    [profile.class_name, profile.email, profile.school_name, profile.subject, roleDescription, roleLabel],
  );

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (cropSourceUrl) URL.revokeObjectURL(cropSourceUrl);
    };
  }, [cropSourceUrl, previewUrl]);

  function handleFileChange(file: File | null) {
    if (!file) return;

    if (!allowedImageTypes.includes(file.type)) {
      toast.error('File harus berupa gambar JPG, PNG, atau WebP.');
      return;
    }

    if (file.size > hardMaxAvatarSize) {
      toast.error('Ukuran gambar terlalu besar. Maksimal 20MB.');
      return;
    }

    if (cropSourceUrl) URL.revokeObjectURL(cropSourceUrl);
    setCropSourceName(file.name);
    setCropSourceUrl(URL.createObjectURL(file));
    setCropState({ zoom: 1, offsetX: 0, offsetY: 0 });
    setIsCropDialogOpen(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleApplyCrop() {
    if (!cropImageRef.current) {
      toast.error('Gambar belum siap diproses.');
      return;
    }

    setIsCropping(true);
    try {
      const blob = await cropAndCompressAvatar(cropImageRef.current, cropState);
      const fileName = `avatar-${profile.id}-${Date.now()}.webp`;
      const nextFile = new File([blob], fileName, { type: blob.type || webpMime });

      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setSelectedFile(nextFile);
      setPreviewUrl(URL.createObjectURL(nextFile));
      setIsCropDialogOpen(false);
      toast.success('Foto siap disimpan. Ukuran sudah dikompres otomatis.');
    } catch (error) {
      console.error('Avatar crop failed', error);
      toast.error(error instanceof Error ? error.message : 'Gagal memproses foto profil.');
    } finally {
      setIsCropping(false);
    }
  }

  async function handleSave() {
    const normalizedName = fullName.trim();
    if (normalizedName.length < 2) {
      toast.warning('Nama lengkap minimal 2 karakter.');
      return;
    }

    setIsSaving(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!user || user.id !== profile.id) throw new Error('Sesi akun tidak valid. Silakan masuk kembali.');

      let nextAvatarUrl = avatarUrl;
      if (selectedFile) {
        const path = `avatars/${user.id}/${Date.now()}-avatar.webp`;
        const { error: uploadError } = await supabase.storage
          .from('profile-avatars')
          .upload(path, selectedFile, {
            cacheControl: '3600',
            contentType: selectedFile.type || webpMime,
            upsert: true,
          });

        if (uploadError) throw new Error(formatStorageError(uploadError.message));

        const { data } = supabase.storage.from('profile-avatars').getPublicUrl(path);
        nextAvatarUrl = data.publicUrl;
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: normalizedName,
          avatar_url: nextAvatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) throw new Error(formatProfileUpdateError(updateError.message));

      setAvatarUrl(nextAvatarUrl);
      setSelectedFile(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      toast.success('Profil berhasil diperbarui.');
      router.refresh();
    } catch (error) {
      console.error('Profile save failed', error);
      toast.error(formatUnknownError(error, 'Gagal menyimpan profil.'));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteAvatar() {
    if (!avatarUrl || isDeleting) return;
    if (!window.confirm('Hapus foto profil? Avatar akan kembali ke inisial nama.')) return;

    setIsDeleting(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw new Error(formatAuthError(userError.message));
      if (!user || user.id !== profile.id) throw new Error('Sesi akun tidak valid. Silakan masuk kembali.');

      const storagePath = extractAvatarStoragePath(avatarUrl);
      if (storagePath) {
        const { error: removeError } = await supabase.storage.from('profile-avatars').remove([storagePath]);
        if (removeError) console.warn('Avatar storage delete skipped', removeError);
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: null, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (updateError) throw new Error(formatProfileUpdateError(updateError.message));

      setAvatarUrl(null);
      setSelectedFile(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      toast.success('Foto profil dihapus.');
      router.refresh();
    } catch (error) {
      console.error('Profile avatar delete failed', error);
      toast.error(formatUnknownError(error, 'Gagal menghapus foto profil.'));
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="mt-8 grid gap-6 xl:grid-cols-[0.36fr_0.64fr]">
      <SectionCard className="text-center">
        <div className="flex justify-center">
          <UserAvatar name={fullName} imageUrl={currentPreview} size="lg" textClassName="hidden" />
        </div>
        <h2 className="mt-5 text-xl font-extrabold text-ink">{fullName || profile.full_name}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{roleDescription ?? roleLabel}</p>

        <div className="mt-6 flex flex-col gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(event) => handleFileChange(event.target.files?.[0] ?? null)}
          />
          <Button type="button" onClick={() => fileInputRef.current?.click()} disabled={isSaving || isDeleting}>
            <Camera className="h-4 w-4" />
            Ganti Foto Profil
          </Button>
          {avatarUrl && (
            <Button type="button" variant="outline" onClick={handleDeleteAvatar} disabled={isSaving || isDeleting}>
              <Trash2 className="h-4 w-4" />
              {isDeleting ? 'Menghapus...' : 'Hapus Foto'}
            </Button>
          )}
        </div>
        <p className="mt-4 text-xs leading-5 text-muted-foreground">
          Format JPG, PNG, atau WebP. Foto besar akan dicrop 1:1 dan dikompres otomatis.
        </p>
      </SectionCard>

      <SectionCard>
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-mint text-primary">
            <Upload className="h-5 w-5" />
          </div>
          <div>
            <p className="font-bold text-ink">Profil Saya</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Perbarui nama dan foto profil yang tampil di topbar aplikasi.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-5">
          <div className="grid gap-2">
            <Label htmlFor="fullName">Nama lengkap</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Masukkan nama lengkap"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {detailRows.map((row) => (
              <div key={row.label} className="rounded-2xl border border-border bg-white px-4 py-4">
                <p className="text-xs font-semibold text-muted-foreground">{row.label}</p>
                <p className="mt-1 truncate font-bold text-ink">{row.value}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button type="button" onClick={handleSave} disabled={!canSave || !hasChanges || isSaving || isDeleting}>
              {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
            {selectedFile && (
              <Button
                type="button"
                variant="outline"
                disabled={isSaving}
                onClick={() => {
                  setSelectedFile(null);
                  if (previewUrl) {
                    URL.revokeObjectURL(previewUrl);
                    setPreviewUrl(null);
                  }
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
              >
                Batalkan Foto Baru
              </Button>
            )}
          </div>
        </div>
      </SectionCard>

      <Dialog open={isCropDialogOpen} onOpenChange={(open) => !isCropping && setIsCropDialogOpen(open)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Crop Foto Profil</DialogTitle>
            <DialogDescription>
              Atur area foto dengan rasio 1:1. Hasilnya akan dikompres otomatis sebelum diupload.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5">
            <div className="mx-auto aspect-square w-full max-w-[420px] overflow-hidden rounded-3xl border border-border bg-slate-100 shadow-inner">
              {cropSourceUrl && (
                // eslint-disable-next-line @next/next/no-img-element -- Local object URL is used for client-side crop preview.
                <img
                  ref={cropImageRef}
                  src={cropSourceUrl}
                  alt="Preview crop foto profil"
                  className="h-full w-full object-cover"
                  style={{
                    objectPosition: `${50 + cropState.offsetX}% ${50 + cropState.offsetY}%`,
                    transform: `scale(${cropState.zoom})`,
                    transformOrigin: 'center',
                  }}
                />
              )}
            </div>

            <div className="grid gap-4 rounded-2xl border border-border bg-white p-4">
              <CropSlider
                label="Zoom"
                min={1}
                max={3}
                step={0.05}
                value={cropState.zoom}
                onChange={(zoom) => setCropState((current) => ({ ...current, zoom }))}
              />
              <CropSlider
                label="Geser horizontal"
                min={-50}
                max={50}
                step={1}
                value={cropState.offsetX}
                onChange={(offsetX) => setCropState((current) => ({ ...current, offsetX }))}
              />
              <CropSlider
                label="Geser vertikal"
                min={-50}
                max={50}
                step={1}
                value={cropState.offsetY}
                onChange={(offsetY) => setCropState((current) => ({ ...current, offsetY }))}
              />
              <p className="text-xs leading-5 text-muted-foreground">
                File dipilih: {cropSourceName}. Output avatar akan dibuat sebagai WebP sekitar maksimal 2MB.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isCropping}
              onClick={() => setIsCropDialogOpen(false)}
            >
              Batal
            </Button>
            <Button type="button" disabled={isCropping} onClick={handleApplyCrop}>
              {isCropping ? 'Memproses...' : 'Gunakan Foto Ini'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CropSlider({
  label,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="grid gap-2">
      <span className="flex items-center justify-between text-sm font-bold text-ink">
        {label}
        <span className="text-xs font-semibold text-muted-foreground">{value.toFixed(step < 1 ? 2 : 0)}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full accent-primary"
      />
    </label>
  );
}

async function cropAndCompressAvatar(image: HTMLImageElement, crop: CropState) {
  const naturalWidth = image.naturalWidth;
  const naturalHeight = image.naturalHeight;
  if (!naturalWidth || !naturalHeight) throw new Error('Gambar belum selesai dimuat.');

  for (const size of avatarCanvasSizes) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Browser tidak mendukung pemrosesan gambar.');

    const sourceSize = Math.max(1, Math.min(naturalWidth, naturalHeight) / crop.zoom);
    const maxOffsetX = Math.max(0, (naturalWidth - sourceSize) / 2);
    const maxOffsetY = Math.max(0, (naturalHeight - sourceSize) / 2);
    const centerX = naturalWidth / 2 + (crop.offsetX / 50) * maxOffsetX;
    const centerY = naturalHeight / 2 + (crop.offsetY / 50) * maxOffsetY;
    const sourceX = clamp(centerX - sourceSize / 2, 0, naturalWidth - sourceSize);
    const sourceY = clamp(centerY - sourceSize / 2, 0, naturalHeight - sourceSize);

    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, size, size);
    context.drawImage(image, sourceX, sourceY, sourceSize, sourceSize, 0, 0, size, size);

    for (let quality = 0.9; quality >= 0.65; quality -= 0.05) {
      const blob = await canvasToBlob(canvas, webpMime, Number(quality.toFixed(2)));
      if (blob.size <= targetAvatarSize) return blob;
    }
  }

  throw new Error('Gambar gagal dikompres di bawah 2MB. Coba crop area lebih kecil atau gunakan gambar lain.');
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
        return;
      }
      reject(new Error('Gagal membuat file gambar dari hasil crop.'));
    }, type, quality);
  });
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function extractAvatarStoragePath(publicUrl: string) {
  const marker = '/storage/v1/object/public/profile-avatars/';
  const markerIndex = publicUrl.indexOf(marker);
  if (markerIndex === -1) return null;

  return decodeURIComponent(publicUrl.slice(markerIndex + marker.length));
}

function formatStorageError(message: string) {
  const normalized = message.toLowerCase();
  if (normalized.includes('bucket') || normalized.includes('not found')) {
    return 'Bucket profile-avatars belum tersedia. Jalankan supabase/storage.sql terlebih dahulu.';
  }
  if (normalized.includes('row-level security') || normalized.includes('policy')) {
    return 'Gagal mengunggah foto profil karena policy Storage belum mengizinkan folder akun ini.';
  }
  if (normalized.includes('payload') || normalized.includes('size') || normalized.includes('too large')) {
    return 'Gagal mengunggah foto profil karena ukuran hasil kompresi masih terlalu besar.';
  }
  if (normalized.includes('failed to fetch') || normalized.includes('network')) {
    return 'Gagal mengunggah foto profil. Periksa koneksi atau konfigurasi Supabase Storage.';
  }
  return `Gagal mengunggah foto profil. ${message}`;
}

function formatProfileUpdateError(message: string) {
  const normalized = message.toLowerCase();
  if (normalized.includes('row-level security') || normalized.includes('policy')) {
    return 'Gagal memperbarui profil karena policy database belum mengizinkan update profil.';
  }
  if (normalized.includes('failed to fetch') || normalized.includes('network')) {
    return 'Gagal memperbarui profil. Periksa koneksi atau konfigurasi Supabase.';
  }
  return `Gagal memperbarui profil. ${message}`;
}

function formatAuthError(message: string) {
  if (message.toLowerCase().includes('failed to fetch')) {
    return 'Gagal membaca sesi akun. Periksa koneksi atau konfigurasi Supabase.';
  }
  return message;
}

function formatUnknownError(error: unknown, fallback: string) {
  if (!(error instanceof Error)) return fallback;
  const normalized = error.message.toLowerCase();
  if (normalized.includes('failed to fetch')) {
    return `${fallback} Periksa koneksi atau konfigurasi Supabase.`;
  }
  return error.message;
}
