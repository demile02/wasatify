import {
  BarChart3,
  BookOpen,
  ClipboardCheck,
  GraduationCap,
  Megaphone,
  PenLine,
  Sparkles,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { AppLogo } from '@/components/shared/app-logo';
import { ProgressBar } from '@/components/shared/progress-bar';
import { SectionCard } from '@/components/shared/section-card';
import { Button } from '@/components/ui/button';

const studentStats = [
  { label: 'Modul Selesai', value: '8', description: 'dari 12 modul' },
  { label: 'Kuis Dikerjakan', value: '14', description: 'skor rata-rata 86' },
  { label: 'Refleksi', value: '6', description: 'aksi nyata terkumpul' },
];

const teacherStats = [
  { label: 'Kelas Aktif', value: '4', description: '128 siswa' },
  { label: 'Modul Published', value: '18', description: 'siap dipelajari' },
  { label: 'Refleksi Ditinjau', value: '74%', description: 'minggu ini' },
];

const sampleModules = [
  { title: 'Tawazun dalam Keseharian', progress: 78, status: 'In Progress' },
  { title: 'Adab Belajar Digital', progress: 100, status: 'Selesai' },
  { title: 'Tasamuh dan Perbedaan', progress: 35, status: 'Belum selesai' },
];

const classProgress = [
  { name: 'VII A', students: 32, progress: 82 },
  { name: 'VII B', students: 30, progress: 64 },
  { name: 'VIII A', students: 34, progress: 76 },
];

export default function DemoPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <header className="border-b border-primary/10 bg-white/88 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-5 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
          <AppLogo href="/" size="sm" />
          <Link href="/" className="text-sm font-bold text-primary hover:underline">
            Beranda
          </Link>
        </div>
      </header>

      <section className="relative border-b border-primary/10 bg-[linear-gradient(140deg,hsl(var(--cream))_0%,hsl(var(--background))_48%,hsl(var(--mint))_100%)]">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:py-16">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/10 bg-white/78 px-4 py-2 text-sm font-bold text-primary shadow-sm">
              <Sparkles className="h-4 w-4 text-gold" />
              Ini adalah data contoh untuk pratinjau
            </div>
            <h1 className="mt-6 text-4xl font-extrabold leading-tight text-ink sm:text-5xl">
              Demo WASATIFY
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
              Lihat gambaran pengalaman belajar siswa dan pengelolaan guru tanpa login. Halaman ini bersifat read-only
              dan tidak menyimpan data apa pun.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/demo/student">
                  <GraduationCap className="h-5 w-5" />
                  Coba sebagai Siswa
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/demo/teacher">
                  <Users className="h-5 w-5" />
                  Coba sebagai Guru
                </Link>
              </Button>
            </div>
          </div>

          <DemoHeroPreview />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:py-16">
        <SectionTitle
          eyebrow="Preview siswa"
          title="Belajar ringkas, kuis langsung, refleksi tersimpan"
          description="Contoh alur siswa dari dashboard sampai hasil kuis dan refleksi."
        />

        <div className="mt-8 grid gap-5 lg:grid-cols-[0.94fr_1.06fr]">
          <SectionCard className="bg-dark-emerald text-white">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-gold">Dashboard Siswa</p>
                <h2 className="mt-2 text-2xl font-extrabold">Assalamu&apos;alaikum, Nadia</h2>
                <p className="mt-2 text-sm leading-6 text-white/72">
                  Lanjutkan modul aktif dan pantau progres belajar hari ini.
                </p>
              </div>
              <BookOpen className="h-9 w-9 text-gold" />
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {studentStats.map((stat) => (
                <div key={stat.label} className="rounded-2xl bg-white/10 p-4">
                  <p className="text-2xl font-extrabold">{stat.value}</p>
                  <p className="mt-1 text-xs font-semibold text-white/72">{stat.label}</p>
                  <p className="mt-2 text-[11px] text-white/58">{stat.description}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-2xl bg-white p-4 text-ink">
              <p className="text-sm font-bold text-gold">Lanjutkan Belajar</p>
              <h3 className="mt-2 text-xl font-extrabold">Tawazun dalam Keseharian</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Memahami keseimbangan antara belajar, ibadah, keluarga, dan kehidupan sosial.
              </p>
              <div className="mt-4">
                <ProgressBar value={78} label="Progress modul" showValue />
              </div>
            </div>
          </SectionCard>

          <div className="grid gap-5">
            <SectionCard>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-primary">Modul Belajar</p>
                  <h3 className="mt-1 text-xl font-extrabold text-ink">Daftar modul siswa</h3>
                </div>
                <BookOpen className="h-8 w-8 text-primary" />
              </div>
              <div className="mt-5 space-y-4">
                {sampleModules.map((module) => (
                  <div key={module.title} className="rounded-2xl border border-border bg-background p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="font-bold text-ink">{module.title}</p>
                        <p className="mt-1 text-xs font-semibold text-muted-foreground">{module.status}</p>
                      </div>
                      <span className="rounded-full bg-mint px-3 py-1 text-xs font-bold text-primary">
                        {module.progress}%
                      </span>
                    </div>
                    <div className="mt-3">
                      <ProgressBar value={module.progress} />
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            <div className="grid gap-5 md:grid-cols-2">
              <MiniPreview
                icon={ClipboardCheck}
                title="Hasil Kuis"
                headline="90 / 100"
                description="Jawaban benar, pembahasan, dan status kelulusan tampil setelah submit."
              />
              <MiniPreview
                icon={PenLine}
                title="Refleksi"
                headline="Aksi nyata"
                description="Siswa menulis pelajaran bermakna dan rencana tindakan kecil."
              />
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-primary/10 bg-white/76">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:py-16">
          <SectionTitle
            eyebrow="Preview guru"
            title="Kelola kelas, modul, refleksi, dan laporan"
            description="Contoh ruang kerja guru untuk melihat progres kelas dan menyiapkan materi."
          />

          <div className="mt-8 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
            <SectionCard>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-primary">Dashboard Guru</p>
                  <h2 className="mt-2 text-2xl font-extrabold text-ink">Assalamu&apos;alaikum, Ust. Ahmad</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Ringkasan aktivitas belajar dan mengajar dari kelas yang dikelola.
                  </p>
                </div>
                <Users className="h-9 w-9 text-gold" />
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {teacherStats.map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-border bg-background p-4">
                    <p className="text-2xl font-extrabold text-ink">{stat.value}</p>
                    <p className="mt-1 text-xs font-semibold text-muted-foreground">{stat.label}</p>
                    <p className="mt-2 text-[11px] text-muted-foreground">{stat.description}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 space-y-4">
                {classProgress.map((item) => (
                  <div key={item.name} className="rounded-2xl border border-border bg-white p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-ink">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.students} siswa aktif</p>
                      </div>
                      <p className="text-sm font-extrabold text-primary">{item.progress}%</p>
                    </div>
                    <ProgressBar value={item.progress} />
                  </div>
                ))}
              </div>
            </SectionCard>

            <div className="grid gap-5">
              <MiniPreview
                icon={BookOpen}
                title="Manajemen Modul"
                headline="Draft -> Published"
                description="Guru membuat lesson, kuis, infografik PDF, lalu publish ketika siap."
              />
              <MiniPreview
                icon={BarChart3}
                title="Laporan & Analitik"
                headline="82%"
                description="Pantau penyelesaian kelas, nilai kuis terbaik, refleksi, dan aktivitas siswa."
              />
              <MiniPreview
                icon={Megaphone}
                title="Pengumuman"
                headline="Published"
                description="Informasi penting dapat dikirim untuk semua kelas atau kelas tertentu."
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
        <div className="rounded-[1.75rem] bg-dark-emerald p-6 text-white shadow-soft sm:p-8 lg:flex lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-bold text-gold">Siap mencoba langsung?</p>
            <h2 className="mt-2 text-2xl font-extrabold sm:text-3xl">Mulai dari akun siswa atau guru.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/72">
              Setelah registrasi, gunakan kelas dan modul nyata dari Supabase untuk menguji alur end-to-end.
            </p>
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row lg:mt-0">
            <Button asChild variant="secondary">
              <Link href="/register/student">Daftar Siswa</Link>
            </Button>
            <Button asChild className="bg-gold text-white hover:bg-gold/90">
              <Link href="/register/teacher">Daftar Guru</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}

function DemoHeroPreview() {
  return (
    <div className="grid gap-4 rounded-[2rem] border border-primary/10 bg-white p-4 shadow-soft sm:p-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl bg-mint p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-primary">Siswa</p>
            <GraduationCap className="h-6 w-6 text-primary" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-ink">78%</h2>
          <p className="mt-1 text-sm text-muted-foreground">progress belajar</p>
          <div className="mt-5">
            <ProgressBar value={78} />
          </div>
        </div>
        <div className="rounded-3xl bg-cream p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-gold">Guru</p>
            <BarChart3 className="h-6 w-6 text-gold" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-ink">4 kelas</h2>
          <p className="mt-1 text-sm text-muted-foreground">dipantau real-time</p>
          <div className="mt-5 grid grid-cols-4 gap-2">
            {[55, 70, 82, 64].map((value, index) => (
              <span key={`${value}-${index}`} className="block rounded-t-xl bg-primary" style={{ height: `${value}px` }} />
            ))}
          </div>
        </div>
      </div>
      <div className="rounded-3xl border border-border bg-background p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold text-ink">Siklus belajar WASATIFY</p>
            <p className="mt-1 text-sm text-muted-foreground">Materi, kuis, refleksi, laporan.</p>
          </div>
          <div className="flex gap-2">
            {[BookOpen, ClipboardCheck, PenLine, BarChart3].map((Icon, index) => (
              <span key={index} className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-primary shadow-sm">
                <Icon className="h-5 w-5" />
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="max-w-3xl">
      <p className="text-sm font-bold text-gold">{eyebrow}</p>
      <h2 className="mt-2 text-3xl font-extrabold leading-tight text-ink sm:text-4xl">{title}</h2>
      <p className="mt-3 text-base leading-8 text-muted-foreground">{description}</p>
    </div>
  );
}

function MiniPreview({
  icon: Icon,
  title,
  headline,
  description,
}: {
  icon: LucideIcon;
  title: string;
  headline: string;
  description: string;
}) {
  return (
    <SectionCard>
      <div className="flex items-start gap-4">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-mint text-primary">
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-primary">{title}</p>
          <h3 className="mt-1 text-xl font-extrabold text-ink">{headline}</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
      </div>
    </SectionCard>
  );
}
