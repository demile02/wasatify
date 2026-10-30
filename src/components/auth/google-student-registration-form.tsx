'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { KeyRound, UserRound } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { AuthAlert } from '@/components/auth/auth-alert';
import { AuthInput } from '@/components/auth/auth-fields';
import { Button } from '@/components/ui/button';

const registrationSchema = z.object({
  fullName: z.string().trim().min(3, 'Nama lengkap minimal 3 karakter.'),
  classCode: z.string().trim().min(4, 'Kode kelas wajib diisi.'),
});

type RegistrationValues = z.infer<typeof registrationSchema>;

type GoogleStudentRegistrationFormProps = {
  email: string;
  initialFullName: string;
};

export function GoogleStudentRegistrationForm({
  email,
  initialFullName,
}: GoogleStudentRegistrationFormProps) {
  const router = useRouter();
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegistrationValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: { fullName: initialFullName, classCode: '' },
  });

  async function onSubmit(values: RegistrationValues) {
    setError('');

    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const fullName = values.fullName.trim();
      const classCode = values.classCode.trim().toUpperCase();
      const { data: classCodeIsValid, error: validationError } = await supabase.rpc(
        'validate_class_code',
        { input_class_code: classCode },
      );

      if (validationError) throw validationError;
      if (classCodeIsValid !== true) {
        setError('Kode kelas tidak ditemukan. Periksa penulisannya atau minta kode terbaru kepada guru.');
        return;
      }

      const { data, error: updateError } = await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          name: fullName,
          class_code: classCode,
        },
      });

      if (updateError) throw updateError;
      if (!data.user) throw new Error('Sesi Google sudah berakhir. Masuk kembali untuk melanjutkan.');

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, class_id')
        .eq('id', data.user.id)
        .maybeSingle<{ role: string; class_id: string | null }>();

      if (profileError) throw profileError;
      if (profile?.role !== 'student' || !profile.class_id) {
        setError('Kode kelas belum berhasil diverifikasi. Periksa kembali kode dari guru.');
        return;
      }

      toast.success('Pendaftaran siswa selesai.');
      router.replace('/student/dashboard');
      router.refresh();
    } catch (submitError) {
      setError(getRegistrationErrorMessage(submitError));
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-extrabold text-ink sm:text-4xl">Lengkapi profil siswa</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
        {error && <AuthAlert type="error" message={error} />}

        <AuthInput
          label="Nama lengkap"
          placeholder="Masukkan nama lengkap"
          autoComplete="name"
          leftIcon={<UserRound className="h-4 w-4" />}
          error={errors.fullName?.message}
          {...register('fullName')}
        />

        <AuthInput
          label="Email Google"
          type="email"
          value={email}
          readOnly
          autoComplete="email"
        />

        <AuthInput
          label="Kode Kelas (minta kode ke guru)"
          placeholder="Contoh: KLS-AB12CD"
          autoComplete="one-time-code"
          leftIcon={<KeyRound className="h-4 w-4" />}
          error={errors.classCode?.message}
          {...register('classCode')}
        />

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Memeriksa kode kelas…' : 'Selesaikan Pendaftaran'}
        </Button>
      </form>
    </div>
  );
}

function getRegistrationErrorMessage(error: unknown) {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (message.includes('database error updating user') || message.includes('error updating user')) {
      return 'Profil gagal disimpan. Coba lagi. Jika masalah terus muncul, hubungi guru atau admin.';
    }
    return error.message;
  }

  return 'Pendaftaran belum berhasil. Periksa kembali data yang dimasukkan.';
}
