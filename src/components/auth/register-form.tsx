'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, KeyRound, Lock, UserRound } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { AuthAlert } from '@/components/auth/auth-alert';
import { AuthInput, AuthTextarea } from '@/components/auth/auth-fields';
import { EmailInputWithSuggestions } from '@/components/auth/email-input-with-suggestions';
import { SocialAuthButtons } from '@/components/auth/social-auth-buttons';
import { Button } from '@/components/ui/button';
import { getRoleDashboardPath } from '@/lib/auth/roles';
import { createClient } from '@/lib/supabase/client';
import type { AppRole } from '@/lib/types';

type RegisterFormProps = {
  role: Extract<AppRole, 'student' | 'teacher'>;
};

const registerSchema = z
  .object({
    fullName: z.string().trim().min(3, 'Nama lengkap minimal 3 karakter.'),
    email: z.string().trim().email('Email tidak valid.'),
    classCode: z.string().trim().optional(),
    teacherCode: z.string().trim().optional(),
    subject: z.string().trim().optional(),
    password: z.string().min(6, 'Password minimal 6 karakter.'),
    confirmPassword: z.string().min(1, 'Konfirmasi password wajib diisi.'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Konfirmasi password belum sama.',
    path: ['confirmPassword'],
  })
  .superRefine((values, context) => {
    if (values.teacherCode !== undefined && values.teacherCode.trim().length > 0 && values.teacherCode.trim().length < 4) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Kode guru terlalu pendek.',
        path: ['teacherCode'],
      });
    }

    if (values.classCode !== undefined && values.classCode.trim().length > 0 && values.classCode.trim().length < 4) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Kode kelas terlalu pendek.',
        path: ['classCode'],
      });
    }
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterForm({ role }: RegisterFormProps) {
  const router = useRouter();
  const isTeacher = role === 'teacher';
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      classCode: '',
      teacherCode: '',
      subject: '',
      password: '',
      confirmPassword: '',
    },
  });
  const emailRegister = register('email');
  const emailValue = watch('email');

  async function onSubmit(values: RegisterFormValues) {
    setError('');
    setSuccess('');

    try {
      const supabase = createClient();
      const fullName = values.fullName.trim();
      const email = values.email.trim();
      const teacherCode = normalizeCode(values.teacherCode);
      const classCode = normalizeCode(values.classCode);
      const subject = values.subject?.trim() || null;

      if (isTeacher && !teacherCode) {
        throw new Error('Kode guru wajib diisi.');
      }

      if (!isTeacher && !classCode) {
        throw new Error('Kode kelas wajib diisi.');
      }

      if (isTeacher) {
        const { data: isValid, error: validationError } = await supabase.rpc('validate_teacher_invite_code', {
          input_code: teacherCode,
        });

        if (validationError) throw new Error('Kode guru belum bisa divalidasi. Pastikan SQL terbaru sudah dijalankan.');
        if (!isValid) throw new Error('Kode guru tidak valid atau sudah digunakan.');
      } else {
        const { data: isValid, error: validationError } = await supabase.rpc('validate_class_code', {
          input_class_code: classCode,
        });

        if (validationError) throw new Error('Kode kelas belum bisa divalidasi. Pastikan SQL terbaru sudah dijalankan.');
        if (!isValid) throw new Error('Kode kelas tidak valid.');
      }

      const metadata = {
        role,
        full_name: fullName,
        name: fullName,
        class_code: isTeacher ? null : classCode,
        teacher_invite_code: isTeacher ? teacherCode : null,
        subject: isTeacher ? subject : null,
      };

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password: values.password,
        options: {
          data: metadata,
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/login?confirmed=1`,
        },
      });

      if (signUpError) throw signUpError;

      if (data.session?.user) {
        toast.success('Akun berhasil dibuat.');
        router.replace(getRoleDashboardPath(role));
        router.refresh();
        return;
      }

      const message = 'Akun berhasil dibuat. Jika konfirmasi email aktif, cek inbox Anda sebelum login.';
      setSuccess(message);
      toast.success(message);
    } catch (nextError) {
      const message = getRegisterErrorMessage(nextError, role);
      setError(message);
      toast.error(message);
    }
  }

  return (
    <div>
      <p className="text-sm font-semibold text-gold">{isTeacher ? 'Daftar sebagai guru' : 'Daftar sebagai siswa'}</p>
      <h1 className="mt-3 text-3xl font-extrabold text-ink sm:text-4xl">
        {isTeacher ? 'Buat Akun Guru' : 'Buat Akun Siswa'}
      </h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Lengkapi data dasar untuk mulai menggunakan WASATIFY.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
        {error && <AuthAlert type="error" message={error} />}
        {success && <AuthAlert type="success" message={success} />}

        <AuthInput
          label="Nama lengkap"
          placeholder="Masukkan nama lengkap"
          autoComplete="name"
          leftIcon={<UserRound className="h-4 w-4" />}
          error={errors.fullName?.message}
          {...register('fullName')}
        />

        <EmailInputWithSuggestions
          label="Email"
          value={emailValue}
          onValueChange={(nextValue) => setValue('email', nextValue, { shouldDirty: true, shouldValidate: false })}
          name={emailRegister.name}
          inputRef={emailRegister.ref}
          onBlur={emailRegister.onBlur}
          placeholder="nama@email.com"
          autoComplete="email"
          error={errors.email?.message}
        />

        {isTeacher ? (
          <>
            <AuthInput
              label="Kode Guru"
              placeholder="Masukkan kode unik dari admin"
              autoComplete="one-time-code"
              leftIcon={<KeyRound className="h-4 w-4" />}
              error={errors.teacherCode?.message}
              {...register('teacherCode')}
            />
            <p className="-mt-3 text-xs leading-5 text-muted-foreground">
              Kode guru hanya bisa digunakan sekali. Hubungi admin sekolah jika belum memiliki kode.
            </p>
            <AuthTextarea
              label="Mata pelajaran / tugas"
              placeholder="Contoh: Akhlak, PAI, wali kelas, pembina rohis"
              error={errors.subject?.message}
              {...register('subject')}
            />
          </>
        ) : (
          <>
            <AuthInput
              label="Kode Kelas"
              placeholder="Contoh: KLS-AB12CD"
              autoComplete="one-time-code"
              leftIcon={<KeyRound className="h-4 w-4" />}
              error={errors.classCode?.message}
              {...register('classCode')}
            />
            <p className="-mt-3 text-xs leading-5 text-muted-foreground">
              Masukkan kode kelas dari guru. Akun siswa akan otomatis terhubung ke kelas tersebut.
            </p>
          </>
        )}

        <div className="relative">
          <AuthInput
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Buat password"
            autoComplete="new-password"
            leftIcon={<Lock className="h-4 w-4" />}
            className="pr-12"
            error={errors.password?.message}
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className="absolute bottom-3 right-4 text-muted-foreground transition hover:text-primary"
            aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>

        <AuthInput
          label="Confirm password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Ulangi password"
          autoComplete="new-password"
          leftIcon={<Lock className="h-4 w-4" />}
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Membuat akun...' : isTeacher ? 'Daftar sebagai Guru' : 'Daftar sebagai Siswa'}
        </Button>
      </form>

      <div className="my-7 flex items-center gap-3 text-xs font-semibold text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        atau daftar dengan
        <span className="h-px flex-1 bg-border" />
      </div>

      <SocialAuthButtons />

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Sudah punya akun?{' '}
        <Link href="/login" className="font-bold text-primary hover:underline">
          Masuk di sini
        </Link>
      </p>
    </div>
  );
}

function normalizeCode(value: string | null | undefined) {
  return (value ?? '').trim().toUpperCase();
}

function getRegisterErrorMessage(error: unknown, role: Extract<AppRole, 'student' | 'teacher'>) {
  if (error instanceof Error) {
    if (error.message.includes('already registered')) {
      return 'Email ini sudah terdaftar. Silakan login.';
    }
    if (error.message.includes('Database error saving new user')) {
      return role === 'teacher'
        ? 'Kode guru tidak valid atau sudah digunakan.'
        : 'Kode kelas tidak valid.';
    }
    return error.message;
  }

  return 'Terjadi kesalahan saat membuat akun.';
}
