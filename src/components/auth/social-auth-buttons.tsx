'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

type SocialAuthButtonsProps = {
  nextPath?: string;
  label?: string;
  onError: (message: string) => void;
};

export function SocialAuthButtons({ nextPath, label = 'Lanjutkan dengan Google', onError }: SocialAuthButtonsProps) {
  const [isLoading, setIsLoading] = useState(false);

  async function signInWithGoogle() {
    setIsLoading(true);
    onError('');

    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const callbackUrl = new URL('/auth/callback', window.location.origin);
      if (nextPath?.startsWith('/') && !nextPath.startsWith('//')) {
        callbackUrl.searchParams.set('next', nextPath);
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: callbackUrl.toString() },
      });

      if (error) throw error;
    } catch (error) {
      onError(getGoogleAuthErrorMessage(error));
      setIsLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="h-11 w-full rounded-xl bg-white"
      onClick={signInWithGoogle}
      disabled={isLoading}
      aria-busy={isLoading}
    >
      <span aria-hidden="true" className="mr-2 text-base font-bold text-[#4285F4]">G</span>
      {isLoading ? 'Menghubungkan ke Google…' : label}
    </Button>
  );
}

function getGoogleAuthErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.includes('Supabase belum dikonfigurasi')) {
    return 'Login Google belum tersedia karena konfigurasi aplikasi belum lengkap.';
  }

  return 'Tidak bisa membuka login Google. Coba lagi atau gunakan email dan password.';
}
