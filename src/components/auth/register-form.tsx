'use client';

import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Lock, UserRound } from 'lucide-react';
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
import type { PublicRegistrationClass } from '@/lib/auth/classes';
import { createClient } from '@/lib/supabase/client';
import type { AppRole } from '@/lib/types';

type RegisterFormProps = {
  role: Extract<AppRole, 'student' | 'teacher'>;
  initialClasses?: PublicRegistrationClass[];
};

const registerSchema = z
  .object({
    fullName: z.string().trim().min(3, 'Nama lengkap minimal 3 karakter.'),
    email: z.string().trim().email('Email tidak valid.'),
    classId: z.string().trim().optional(),
    className: z.string().trim().optional(),
    subject: z.string().trim().optional(),
    password: z.string().min(6, 'Password minimal 6 karakter.'),
    confirmPassword: z.string().min(1, 'Konfirmasi password wajib diisi.'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Konfirmasi password belum sama.',
    path: ['confirmPassword'],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterForm({ role, initialClasses = [] }: RegisterFormProps) {
  const router = useRouter();
  const isTeacher = role === 'teacher';
  const [showPassword, setShowPassword] = useState(false);
  const [classes, setClasses] = useState<PublicRegistrationClass[]>(initialClasses);
  const [loadingClasses, setLoadingClasses] = useState(!isTeacher && !initialClasses.length);
  const [classesError, setClassesError] = useState('');
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
      classId: '',
      className: '',
      subject: '',
      password: '',
      confirmPassword: '',
    },
  });
  const emailRegister = register('email');
  const emailValue = watch('email');

  useEffect(() => {
    if (isTeacher) return;

    let mounted = true;

    async function loadClasses() {
      if (initialClasses.length) {
        setLoadingClasses(false);
        return;
      }

      try {
        const supabase = createClient();
        const { data, error: classError } = await supabase
          .from('classes')
          .select('id, name, grade_level, academic_year, teacher_id, join_code')
          .order('name', { ascending: true });

        if (!classError) {
          if (mounted) {
            setClasses((data ?? []) as PublicRegistrationClass[]);
            setClassesError('');
          }
          return;
        }

        const { data: rpcData, error: rpcError } = await supabase.rpc('get_public_classes_for_registration');
        if (rpcError) throw rpcError;

        if (mounted) {
          setClasses((rpcData ?? []) as PublicRegistrationClass[]);
          setClassesError('');
        }
      } catch (loadError) {
        if (mounted) setClasses([]);
        if (mounted) {
          setClassesError(loadError instanceof Error ? loadError.message : 'Kelas belum bisa dimuat.');
        }
      } finally {
        if (mounted) setLoadingClasses(false);
      }
    }

    loadClasses();

    return () => {
      mounted = false;
    };
  }, [initialClasses.length, isTeacher]);

  async function onSubmit(values: RegisterFormValues) {
    setError('');
    setSuccess('');

    try {
      const supabase = createClient();
      const fullName = values.fullName.trim();
      const email = values.email.trim();
      const classId = values.classId?.trim() || null;
      const selectedClass = classes.find((classItem) => classItem.id === classId);
      const className = values.className?.trim() || null;
      const subject = values.subject?.trim() || null;
      const metadata = {
        role,
        full_name: fullName,
        name: fullName,
        class_id: isTeacher ? null : classId,
        class_name: isTeacher ? null : selectedClass?.name ?? className,
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
        const { error: profileError } = await supabase.from('profiles').upsert(
          {
            id: data.session.user.id,
            role,
            full_name: fullName,
            email,
            class_id: isTeacher ? null : classId,
            class_name: isTeacher ? null : selectedClass?.name ?? className,
            subject: isTeacher ? subject : null,
          },
          { onConflict: 'id' },
        );

        if (profileError) throw profileError;

        toast.success('Akun berhasil dibuat.');
        router.push(getRoleDashboardPath(role));
        router.refresh();
        return;
      }

      const message = 'Akun berhasil dibuat. Jika konfirmasi email aktif, cek inbox Anda sebelum login.';
      setSuccess(message);
      toast.success(message);
    } catch (nextError) {
      const message = getRegisterErrorMessage(nextError);
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
          <AuthTextarea
            label="Mata pelajaran / tugas"
            placeholder="Contoh: Akhlak, PAI, wali kelas, pembina rohis"
            error={errors.subject?.message}
            {...register('subject')}
          />
        ) : (
          <div className="space-y-2">
            <label className="block text-sm font-bold text-ink">Kelas</label>
            <select
              className="h-12 w-full rounded-xl border border-border bg-white px-4 text-sm font-semibold text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
              disabled={loadingClasses || !classes.length}
              {...register('classId')}
            >
              <option value="">
                {loadingClasses
                  ? 'Memuat kelas...'
                  : classes.length
                    ? 'Pilih kelas'
                    : 'Belum ada kelas tersedia'}
              </option>
              {classes.map((classItem) => (
                <option key={classItem.id} value={classItem.id}>
                  {[classItem.name, classItem.grade_level, classItem.academic_year].filter(Boolean).join(' - ')}
                </option>
              ))}
            </select>
            {classesError && (
              <p className="text-xs leading-5 text-red-600">
                Kelas belum bisa dimuat: {classesError}. Pastikan `schema.sql` dan `rls.sql` terbaru sudah dijalankan.
              </p>
            )}
            {!classes.length && !loadingClasses && (
              <p className="text-xs leading-5 text-muted-foreground">
                Belum ada kelas tersedia. Hubungi guru, atau lanjut daftar dan minta guru menghubungkan akunmu nanti.
              </p>
            )}
            {errors.classId?.message && <p className="text-xs font-semibold text-red-600">{errors.classId.message}</p>}
          </div>
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

function getRegisterErrorMessage(error: unknown) {
  if (error instanceof Error) {
    if (error.message.includes('already registered')) {
      return 'Email ini sudah terdaftar. Silakan login.';
    }
    return error.message;
  }

  return 'Terjadi kesalahan saat membuat akun.';
}
