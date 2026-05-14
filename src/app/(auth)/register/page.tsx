import { ArrowRight, BookOpen, GraduationCap } from 'lucide-react';
import Link from 'next/link';
import { AuthShell } from '@/components/auth/auth-shell';
import { SectionCard } from '@/components/shared/section-card';

export default function RegisterPage() {
  return (
    <AuthShell
      title="Pilih Peran Anda"
      description="Mulai dengan memilih peran yang paling sesuai. Siswa mendapat pengalaman belajar, guru mendapat ruang kelola kelas dan modul."
    >
      <div>
        <p className="text-sm font-semibold text-gold">Pendaftaran</p>
        <h1 className="mt-3 text-3xl font-extrabold text-ink sm:text-4xl">Pilih Peran Anda</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Pilih peran untuk menyesuaikan dashboard, fitur, dan alur belajar di WASATIFY.
        </p>

        <div className="mt-8 grid gap-5">
          <RoleCard
            href="/register/student"
            icon={BookOpen}
            title="Saya Siswa"
            description="Akses materi pembelajaran, kuis, refleksi, progress, dan pencapaian belajar."
          />
          <RoleCard
            href="/register/teacher"
            icon={GraduationCap}
            title="Saya Guru"
            description="Kelola kelas, susun modul, buat kuis, dan pantau perkembangan siswa."
          />
        </div>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Sudah punya akun?{' '}
          <Link href="/login" className="font-bold text-primary hover:underline">
            Masuk di sini
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}

function RoleCard({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: typeof BookOpen;
  title: string;
  description: string;
}) {
  return (
    <Link href={href} className="block">
      <SectionCard as="article" className="group transition hover:-translate-y-0.5 hover:shadow-soft">
        <div className="flex items-center gap-4">
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-mint text-primary">
            <Icon className="h-8 w-8" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-extrabold text-ink">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
          </div>
          <div className="hidden h-11 w-11 shrink-0 place-items-center rounded-full bg-primary text-white transition group-hover:bg-dark-emerald sm:grid">
            <ArrowRight className="h-5 w-5" />
          </div>
        </div>
      </SectionCard>
    </Link>
  );
}
