'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { KeyRound, UserRound } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { AuthAlert } from '@/components/auth/auth-alert';
import { AuthInput, AuthTextarea } from '@/components/auth/auth-fields';
import { Button } from '@/components/ui/button';

const registrationSchema = z.object({
  fullName: z.string().trim().min(3, 'Nama lengkap minimal 3 karakter.'),
  teacherCode: z.string().trim().min(4, 'Kode guru wajib diisi.'),
  subject: z.string().trim().optional(),
});

type RegistrationValues = z.infer<typeof registrationSchema>;

type GoogleTeacherRegistrationFormProps = {
  email: string;
  initialFullName: string;
};

export function GoogleTeacherRegistrationForm({
  email,
  initialFullName,
}: GoogleTeacherRegistrationFormProps) {
  const router = useRouter();
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegistrationValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: { fullName: initialFullName, teacherCode: '', subject: '' },
  });

  async function onSubmit(values: RegistrationValues) {
    setError('');

    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const fullName = values.fullName.trim();
      const teacherCode = values.teacherCode.trim().toUpperCase();
      const { data: teacherCodeIsValid, error: validationError } = await supabase.rpc(
        'validate_teacher_invite_code',
        { input_code: teacherCode },
      );

      if (validationError) throw validationError;
      if (teacherCodeIsValid !== true) {
        setError('Kode guru tidak valid atau sudah digunakan. Minta kode aktif kepada admin.');
        return;
      }

      const { data, error: updateError } = await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          name: fullName,
          teacher_invite_code: teacherCode,
          subject: values.subject?.trim() || null,
        },
      });

      if (updateError) throw updateError;
      if (!data.user) throw new Error('Sesi Google sudah berakhir. Masuk kembali untuk melanjutkan.');

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .maybeSingle<{ role: string }>();

      if (profileError) throw profileError;
      if (profile?.role !== 'teacher') {
        setError('Kode guru belum berhasil diverifikasi. Minta kode aktif kepada admin.');
        return;
      }

      toast.success('Pendaftaran guru selesai.');
      router.replace('/teacher/dashboard');
      router.refresh();
    } catch (submitError) {
      setError(getRegistrationErrorMessage(submitError));
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-extrabold text-ink sm:text-4xl">Lengkapi profil guru</h1>

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

        <AuthInput label="Email Google" type="email" value={email} readOnly autoComplete="email" />

        <AuthInput
          label="Kode Guru (minta kode ke admin)"
          placeholder="Masukkan kode guru"
          autoComplete="one-time-code"
          leftIcon={<KeyRound className="h-4 w-4" />}
          error={errors.teacherCode?.message}
          {...register('teacherCode')}
        />

        <AuthTextarea
          label="Mata pelajaran / tugas"
          placeholder="Contoh: PAI, wali kelas, pembina rohis"
          error={errors.subject?.message}
          {...register('subject')}
        />

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Memeriksa kode guru…' : 'Selesaikan Pendaftaran'}
        </Button>
      </form>
    </div>
  );
}

function getRegistrationErrorMessage(error: unknown) {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (message.includes('database error updating user') || message.includes('error updating user')) {
      return 'Profil guru gagal disimpan. Coba lagi. Jika masalah terus muncul, hubungi admin.';
    }
    return error.message;
  }

  return 'Pendaftaran belum berhasil. Periksa kembali data yang dimasukkan.';
}
