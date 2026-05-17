'use client';

import { LogOut, Settings, UserRound } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { UserAvatar } from '@/components/shared/user-avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/lib/types';

type ProfileMenuProps = {
  profile: Profile;
  roleLabel: 'Siswa' | 'Guru';
  profileHref: string;
};

export function ProfileMenu({ profile, roleLabel, profileHref }: ProfileMenuProps) {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    if (isSigningOut) return;

    setIsSigningOut(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      toast.success('Berhasil keluar dari akun.');
      router.replace('/login');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal keluar. Coba lagi.');
      setIsSigningOut(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="rounded-2xl border border-border bg-white px-2 py-1.5 text-left shadow-sm transition hover:bg-mint focus:outline-none focus:ring-2 focus:ring-primary/30"
          aria-label="Buka menu profil"
        >
          <UserAvatar name={profile.full_name} imageUrl={profile.avatar_url} roleLabel={roleLabel} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 rounded-2xl p-2">
        <DropdownMenuLabel className="px-3 py-2">
          <span className="block truncate text-sm font-bold text-ink">{profile.full_name}</span>
          <span className="block truncate text-xs font-normal text-muted-foreground">{profile.email ?? roleLabel}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => router.push(profileHref)} className="cursor-pointer rounded-xl px-3 py-2.5">
          {roleLabel === 'Siswa' ? <UserRound className="h-4 w-4" /> : <Settings className="h-4 w-4" />}
          {roleLabel === 'Siswa' ? 'Profil Saya' : 'Pengaturan'}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(event) => {
            event.preventDefault();
            void handleSignOut();
          }}
          disabled={isSigningOut}
          className="cursor-pointer rounded-xl px-3 py-2.5 text-destructive focus:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          {isSigningOut ? 'Keluar...' : 'Keluar'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
