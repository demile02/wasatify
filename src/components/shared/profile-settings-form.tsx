'use client';

import { useMemo, useRef, useState } from 'react';
import { Camera, Trash2, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { SectionCard } from '@/components/shared/section-card';
import { UserAvatar } from '@/components/shared/user-avatar';
import { Button } from '@/components/ui/button';
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
const maxAvatarSize = 2 * 1024 * 1024;

export function ProfileSettingsForm({ profile, roleLabel, roleDescription }: ProfileSettingsFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fullName, setFullName] = useState(profile.full_name);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
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

  function handleFileChange(file: File | null) {
    if (!file) return;

    if (!allowedImageTypes.includes(file.type)) {
      toast.error('File harus berupa gambar JPG, PNG, atau WebP.');
      return;
    }

    if (file.size > maxAvatarSize) {
      toast.error('Ukuran foto maksimal 2MB.');
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
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
        const path = `avatars/${user.id}/${Date.now()}-${safeFileName(selectedFile.name)}`;
        const { error: uploadError } = await supabase.storage
          .from('profile-avatars')
          .upload(path, selectedFile, {
            cacheControl: '3600',
            contentType: selectedFile.type,
            upsert: true,
          });

        if (uploadError) throw uploadError;

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

      if (updateError) throw updateError;

      setAvatarUrl(nextAvatarUrl);
      setSelectedFile(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      toast.success('Profil berhasil diperbarui.');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menyimpan profil.');
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

      if (userError) throw userError;
      if (!user || user.id !== profile.id) throw new Error('Sesi akun tidak valid. Silakan masuk kembali.');

      const storagePath = extractAvatarStoragePath(avatarUrl);
      if (storagePath) {
        await supabase.storage.from('profile-avatars').remove([storagePath]);
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: null, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setAvatarUrl(null);
      setSelectedFile(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      toast.success('Foto profil dihapus.');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menghapus foto profil.');
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
        <p className="mt-4 text-xs leading-5 text-muted-foreground">Format JPG, PNG, atau WebP. Maksimal 2MB.</p>
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
    </div>
  );
}

function safeFileName(fileName: string) {
  const [name = 'avatar', extension = 'png'] = fileName.split(/\.(?=[^.]+$)/);
  const safeBase = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70);
  const safeExtension = extension.toLowerCase().replace(/[^a-z0-9]/g, '') || 'png';
  return `${safeBase || 'avatar'}.${safeExtension}`;
}

function extractAvatarStoragePath(publicUrl: string) {
  const marker = '/storage/v1/object/public/profile-avatars/';
  const markerIndex = publicUrl.indexOf(marker);
  if (markerIndex === -1) return null;

  return decodeURIComponent(publicUrl.slice(markerIndex + marker.length));
}
