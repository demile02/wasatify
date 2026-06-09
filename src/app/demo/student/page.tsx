import { ArrowLeft, BarChart3, BookOpen, ClipboardCheck, PenLine, Sparkles, Trophy } from 'lucide-react';
import Link from 'next/link';
import { PublicContainer } from '@/components/layout/public-container';
import { AppLogo } from '@/components/shared/app-logo';
import { ProgressBar } from '@/components/shared/progress-bar';
import { SectionCard } from '@/components/shared/section-card';
import { Button } from '@/components/ui/button';

const demoModules = [
  { title: 'Tawazun dalam Keseharian', progress: 78, status: 'Sedang dipelajari' },
  { title: 'Adab Belajar Digital', progress: 100, status: 'Sudah selesai' },
  { title: 'Tasamuh dan Perbedaan', progress: 35, status: 'Belum selesai' },
];

export default function DemoStudentPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-primary/10 bg-white/88 backdrop-blur-xl">
        <PublicContainer className="flex items-center justify-between gap-4 py-5">
          <AppLogo href="/" size="sm" />
          <Button asChild variant="outline" size="sm">
            <Link href="/demo">
              <ArrowLeft className="h-4 w-4" />
              Demo
            </Link>
          </Button>
        </PublicContainer>
      </header>

      <section className="border-b border-primary/10 bg-[linear-gradient(140deg,hsl(var(--cream))_0%,hsl(var(--background))_48%,hsl(var(--mint))_100%)]">
        <PublicContainer className="py-10 lg:py-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/10 bg-white/78 px-4 py-2 text-sm font-bold text-primary shadow-sm">
            <Sparkles className="h-4 w-4 text-gold" />
            Ini adalah data contoh untuk pratinjau.
          </div>
          <div className="mt-6 grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div>
              <p className="text-sm font-bold text-gold">Demo siswa read-only</p>
              <h1 className="mt-3 text-4xl font-extrabold leading-tight text-ink sm:text-5xl">Dashboard Siswa WASATIFY</h1>
              <p className="mt-4 max-w-2xl text-base leading-8 text-muted-foreground">
                Lihat contoh pengalaman belajar siswa tanpa login. Semua tombol aksi diarahkan ke pendaftaran dan
                tidak menyimpan data apa pun.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg">
                  <Link href="/register/student">Daftar untuk mencoba</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/demo">Kembali ke Demo</Link>
                </Button>
              </div>
            </div>

            <SectionCard className="bg-dark-emerald text-white">
              <p className="text-sm font-bold text-gold">Assalamu&apos;alaikum, Nadia</p>
              <h2 className="mt-3 text-2xl font-extrabold">Lanjutkan pembelajaran hari ini</h2>
              <p className="mt-2 text-sm leading-6 text-white/72">
                Contoh ringkasan progress, kuis, poin, dan streak yang muncul di akun siswa.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-4">
                <DemoStat icon={BookOpen} label="Modul Selesai" value="8" />
                <DemoStat icon={ClipboardCheck} label="Kuis" value="14" />
                <DemoStat icon={Trophy} label="XP" value="2.450" />
                <DemoStat icon={BarChart3} label="Progress" value="78%" />
              </div>
            </SectionCard>
          </div>
        </PublicContainer>
      </section>

      <PublicContainer as="section" className="grid gap-6 py-10 lg:grid-cols-[1fr_0.72fr] lg:py-14">
        <div className="grid gap-6">
          <SectionCard>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-primary">Modul Belajar</p>
                <h2 className="mt-1 text-2xl font-extrabold text-ink">Rekomendasi Modul</h2>
              </div>
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {demoModules.map((module) => (
                <div key={module.title} className="rounded-2xl border border-border bg-background p-4">
                  <p className="font-bold text-ink">{module.title}</p>
                  <p className="mt-1 text-xs font-semibold text-primary">{module.status}</p>
                  <div className="mt-4">
                    <ProgressBar value={module.progress} showValue />
                  </div>
                  <Button asChild variant="outline" size="sm" className="mt-4 w-full">
                    <Link href="/register/student">Daftar untuk mencoba</Link>
                  </Button>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-primary">Hasil Kuis</p>
                <h2 className="mt-1 text-2xl font-extrabold text-ink">Review Jawaban</h2>
              </div>
              <ClipboardCheck className="h-8 w-8 text-gold" />
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-[0.35fr_0.65fr]">
              <div className="rounded-2xl bg-mint p-5 text-center">
                <p className="text-5xl font-extrabold text-primary">90</p>
                <p className="mt-1 text-sm font-semibold text-muted-foreground">/ 100</p>
                <p className="mt-3 rounded-full bg-white px-3 py-1 text-xs font-bold text-primary">Lulus</p>
              </div>
              <div className="space-y-3">
                {['Jawaban benar: 9 dari 10', 'Pembahasan terbuka setelah submit', 'Nilai terbaik tersimpan'].map((item) => (
                  <div key={item} className="rounded-2xl border border-border bg-white px-4 py-3 text-sm font-semibold text-foreground">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>
        </div>

        <div className="grid gap-6">
          <SectionCard>
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-mint text-primary">
              <PenLine className="h-6 w-6" />
            </div>
            <p className="mt-5 text-sm font-bold text-primary">Refleksi</p>
            <h2 className="mt-1 text-2xl font-extrabold text-ink">Makna pembelajaran</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              Saya belajar bahwa sikap tawazun membantu menjaga keseimbangan antara belajar, ibadah, dan membantu
              keluarga. Aksi nyata saya minggu ini adalah membuat jadwal belajar yang lebih rapi.
            </p>
            <Button asChild className="mt-5 w-full">
              <Link href="/register/student">Daftar untuk mencoba</Link>
            </Button>
          </SectionCard>

          <SectionCard>
            <p className="font-bold text-ink">Progress Belajar</p>
            <div className="mt-5 space-y-5">
              <ProgressBar value={78} label="Progress keseluruhan" showValue />
              <ProgressBar value={86} label="Rata-rata nilai kuis" showValue />
              <ProgressBar value={60} label="Refleksi terkumpul" showValue />
            </div>
          </SectionCard>
        </div>
      </PublicContainer>
    </main>
  );
}

function DemoStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof BookOpen;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-white/10 p-4">
      <Icon className="h-5 w-5 text-gold" />
      <p className="mt-3 text-2xl font-extrabold">{value}</p>
      <p className="mt-1 text-xs font-semibold text-white/70">{label}</p>
    </div>
  );
}
