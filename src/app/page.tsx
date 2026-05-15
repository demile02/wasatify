import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Facebook,
  Instagram,
  Mail,
  Monitor,
  PenLine,
  PlayCircle,
  Quote,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Youtube,
} from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { PublicHeader } from '@/components/layout/public-header';
import { AppLogo } from '@/components/shared/app-logo';
import { FeatureCard } from '@/components/shared/feature-card';
import { ProgressBar } from '@/components/shared/progress-bar';
import { SectionCard } from '@/components/shared/section-card';
import { Button } from '@/components/ui/button';
import { getRoleDashboardPath } from '@/lib/auth/roles';
import { landingFeatures, landingStats, publicNavigation } from '@/lib/constants/navigation';
import { getCurrentProfile } from '@/lib/auth/server';

const featureIconMap = {
  BookOpen,
  CheckCircle2,
  ShieldCheck,
  BarChart3,
};

const statIcons = [BookOpen, Users, ClipboardCheck, BarChart3];

const moduleSteps = [
  {
    title: 'Pahami Nilai Wasathiyah',
    description: 'Materi pendek tentang tawazun, tasamuh, i\'tidal, dan adab berbeda pendapat.',
    icon: BookOpen,
  },
  {
    title: 'Uji Pemahaman',
    description: 'Kuis singkat dengan feedback agar siswa tahu bagian yang sudah kuat.',
    icon: ClipboardCheck,
  },
  {
    title: 'Refleksi dan Aksi',
    description: 'Siswa menuliskan makna pembelajaran dan rencana tindakan nyata.',
    icon: PenLine,
  },
];

const testimonials = [
  {
    quote: 'Materi singkat membuat siswa lebih konsisten belajar dan lebih berani berdiskusi.',
    name: 'Ust. Ahmad Fauzi',
    role: 'Guru Akhlak',
  },
  {
    quote: 'Kuis dan refleksi membantu saya memahami Islam Wasathiyah dengan cara yang dekat.',
    name: 'Nadia Salabila',
    role: 'Siswa',
  },
];

export default async function HomePage() {
  const profile = await getCurrentProfile();

  if (profile) {
    redirect(getRoleDashboardPath(profile.role));
  }

  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <PublicHeader />

      <section
        id="beranda"
        className="relative border-b border-primary/10 bg-[linear-gradient(140deg,hsl(var(--background))_0%,hsl(var(--cream))_48%,hsl(var(--mint))_100%)]"
      >
        <div className="mx-auto grid min-h-[calc(100vh-5rem)] w-full max-w-7xl items-center gap-12 px-5 py-14 sm:px-8 lg:grid-cols-[0.94fr_1.06fr] lg:py-20">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/10 bg-white/80 px-4 py-2 text-sm font-semibold text-primary shadow-sm">
              <Sparkles className="h-4 w-4 text-gold" />
              Platform microlearning Islam Wasathiyah
            </div>

            <h1 className="max-w-4xl text-4xl font-extrabold leading-tight tracking-normal text-ink sm:text-5xl lg:text-6xl">
              Belajar Islam Wasathiyah, Lebih <span className="text-gold">Mudah</span> dan Bermakna
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
              Microlearning interaktif untuk siswa dan guru. Materi ringkas, kuis seru,
              refleksi mendalam, dan pantau progres belajar dengan mudah.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/register">
                  <BookOpen className="h-5 w-5" />
                  Mulai Belajar
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/login">
                  <PlayCircle className="h-5 w-5" />
                  Lihat Demo
                </Link>
              </Button>
            </div>

            <div className="mt-8 flex max-w-xl items-start gap-3 rounded-2xl border border-gold/20 bg-white/70 p-4 shadow-sm">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold/10 text-gold">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <p className="text-sm leading-6 text-muted-foreground">
                Dirancang untuk pembelajaran Islam yang seimbang, inklusif, dan relevan
                dengan kehidupan siswa sehari-hari.
              </p>
            </div>
          </div>

          <HeroLearningIllustration />
        </div>
      </section>

      <section id="fitur" className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-20">
        <SectionHeading
          eyebrow="Fitur utama"
          title="Pengalaman belajar yang ringkas, reflektif, dan terukur"
          description="Setiap fitur disusun untuk membantu siswa memahami nilai Islam Wasathiyah dan membantu guru memantau perkembangan kelas."
        />
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {landingFeatures.map((feature) => {
            const Icon = featureIconMap[feature.icon];
            return (
              <FeatureCard
                key={feature.title}
                title={feature.title}
                description={feature.description}
                icon={Icon}
              />
            );
          })}
        </div>
      </section>

      <section id="modul" className="bg-white/72">
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
          <div className="rounded-[1.75rem] bg-dark-emerald px-5 py-6 text-white shadow-soft sm:px-8 sm:py-7">
            <div className="grid gap-6 md:grid-cols-4">
              {landingStats.map((stat, index) => {
                const Icon = statIcons[index] ?? Star;
                return (
                  <div key={stat.label} className="flex items-center gap-4 md:justify-center">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-gold/40 bg-white/10 text-gold">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-2xl font-extrabold sm:text-3xl">{stat.value}</p>
                      <p className="text-sm font-medium text-white/76">{stat.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-16 grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold text-gold">Alur modul</p>
              <h2 className="mt-3 text-3xl font-extrabold leading-tight text-ink sm:text-4xl">
                Satu modul pendek, satu pemahaman, satu aksi nyata.
              </h2>
              <p className="mt-4 text-base leading-8 text-muted-foreground">
                WASATIFY menjaga pembelajaran tetap fokus. Siswa membaca materi,
                menguji pemahaman, lalu menutup dengan refleksi yang bisa dipantau guru.
              </p>
            </div>
            <div className="grid gap-4">
              {moduleSteps.map((step, index) => (
                <ModuleStep key={step.title} index={index + 1} {...step} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="tentang" className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
          <div>
            <p className="text-sm font-semibold text-gold">Manfaat untuk semua</p>
            <h2 className="mt-3 text-3xl font-extrabold leading-tight text-ink sm:text-4xl">
              Belajar Efektif, Mengajar Terbantu, Hasil Terukur
            </h2>
            <p className="mt-4 text-base leading-8 text-muted-foreground">
              Platform ini menyatukan pembelajaran mandiri siswa dan ruang kerja guru.
              Hasil belajar, kuis, refleksi, dan aktivitas kelas ditampilkan dengan rapi
              agar keputusan pembelajaran lebih mudah diambil.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              {['Belajar mandiri', 'Mengajar efisien', 'Data akurat'].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-primary/10 bg-white px-4 py-3 text-sm font-semibold text-primary shadow-sm"
                >
                  <CheckCircle2 className="mb-2 h-5 w-5 text-gold" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <DashboardPreview type="student" />
            <DashboardPreview type="teacher" />
          </div>
        </div>
      </section>

      <section id="testimoni" className="border-y border-primary/10 bg-mint/40">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
          <SectionHeading
            eyebrow="Testimoni"
            title="Dibangun untuk kelas yang aktif dan terarah"
            description="WASATIFY menempatkan materi, evaluasi, dan refleksi dalam ritme belajar yang mudah dijalankan."
          />
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {testimonials.map((item) => (
              <SectionCard key={item.name} as="article" className="relative">
                <Quote className="mb-5 h-8 w-8 text-gold" />
                <p className="text-base leading-8 text-foreground">{item.quote}</p>
                <div className="mt-6 border-t border-primary/10 pt-4">
                  <p className="font-bold text-ink">{item.name}</p>
                  <p className="text-sm text-muted-foreground">{item.role}</p>
                </div>
              </SectionCard>
            ))}
          </div>
        </div>
      </section>

      <footer id="kontak" className="bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:px-8 lg:grid-cols-[1fr_0.8fr_0.6fr]">
          <div>
            <AppLogo size="md" />
            <p className="mt-4 max-w-md text-sm leading-7 text-muted-foreground">
              WASATIFY adalah platform microlearning untuk membantu siswa dan guru
              membangun pemahaman Islam Wasathiyah yang moderat, berakhlak, dan terukur.
            </p>
          </div>

          <div>
            <p className="mb-4 font-bold text-ink">Navigasi</p>
            <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground">
              {publicNavigation.map((item) => (
                <Link key={item.label} href={item.href} className="transition hover:text-primary">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-4 font-bold text-ink">Terhubung</p>
            <div className="flex gap-3">
              {[Instagram, Youtube, Facebook, Mail].map((Icon, index) => (
                <Link
                  key={index}
                  href={index === 3 ? 'mailto:hello@wasatify.id' : '#'}
                  aria-label="Social WASATIFY"
                  className="grid h-11 w-11 place-items-center rounded-xl border border-primary/10 bg-background text-primary transition hover:bg-mint"
                >
                  <Icon className="h-5 w-5" />
                </Link>
              ))}
            </div>
          </div>
        </div>
        <div className="border-t border-primary/10 px-5 py-5 text-center text-xs text-muted-foreground">
          (c) 2026 WASATIFY. Platform pembelajaran Islam Wasathiyah.
        </div>
      </footer>
    </main>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="text-sm font-semibold text-gold">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-extrabold leading-tight text-ink sm:text-4xl">{title}</h2>
      <p className="mt-4 text-base leading-8 text-muted-foreground">{description}</p>
    </div>
  );
}

function HeroLearningIllustration() {
  return (
    <div className="relative">
      <div className="relative overflow-hidden rounded-[2rem] border border-primary/10 bg-white shadow-soft">
        <div className="islamic-pattern relative min-h-[430px] p-5 sm:min-h-[540px] sm:p-8">
          <div className="absolute inset-x-8 top-8 h-44 rounded-b-[3rem] rounded-t-[8rem] bg-mint/85" />
          <div className="absolute left-12 top-24 h-36 w-10 rounded-t-full bg-primary/15 sm:left-16" />
          <div className="absolute right-12 top-24 h-36 w-10 rounded-t-full bg-primary/15 sm:right-16" />
          <div className="absolute left-1/2 top-16 h-44 w-44 -translate-x-1/2 rounded-t-full border border-primary/10 bg-white/70" />
          <div className="absolute left-1/2 top-11 h-10 w-10 -translate-x-1/2 rounded-t-full bg-gold/20" />

          <div className="relative z-10 ml-auto grid w-fit grid-cols-3 gap-2">
            {[BookOpen, ShieldCheck, BarChart3].map((Icon, index) => (
              <div key={index} className="grid h-12 w-12 place-items-center rounded-2xl border border-primary/10 bg-white text-primary shadow-sm">
                <Icon className="h-5 w-5" />
              </div>
            ))}
          </div>

          <div className="absolute bottom-0 left-0 right-0 z-10 bg-[linear-gradient(180deg,transparent,hsl(var(--cream))_34%,hsl(var(--cream)))] px-5 pb-6 pt-24 sm:px-8">
            <div className="grid gap-4 md:grid-cols-[0.95fr_1.05fr] md:items-end">
              <div className="rounded-3xl border border-primary/10 bg-white p-4 shadow-card">
                <div className="mb-4 flex items-center gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary text-white">
                    <Users className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-bold text-ink">Siswa belajar</p>
                    <p className="text-xs text-muted-foreground">Materi • Kuis • Refleksi</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <ProgressBar value={72} label="Progress modul" showValue />
                  <div className="grid grid-cols-3 gap-2 text-center text-xs font-semibold text-muted-foreground">
                    <span className="rounded-xl bg-mint px-2 py-2">12 Modul</span>
                    <span className="rounded-xl bg-cream px-2 py-2">18 Kuis</span>
                    <span className="rounded-xl bg-mint px-2 py-2">7 Hari</span>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-primary/10 bg-dark-emerald p-4 text-white shadow-card">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="font-bold">Ruang belajar digital</p>
                    <p className="text-xs text-white/68">Akses fleksibel untuk siswa dan guru</p>
                  </div>
                  <Monitor className="h-6 w-6 text-gold" />
                </div>
                <div className="rounded-2xl bg-white/10 p-3">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-gold" />
                    <span className="h-2 w-12 rounded-full bg-white/35" />
                    <span className="h-2 w-8 rounded-full bg-white/25" />
                  </div>
                  <div className="grid gap-2">
                    <span className="h-3 rounded-full bg-white/65" />
                    <span className="h-3 w-3/4 rounded-full bg-white/35" />
                    <span className="h-3 w-1/2 rounded-full bg-white/25" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ModuleStep({
  index,
  title,
  description,
  icon: Icon,
}: {
  index: number;
  title: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <div className="grid gap-4 rounded-2xl border border-primary/10 bg-white p-5 shadow-card sm:grid-cols-[auto_1fr]">
      <div className="flex items-center gap-3 sm:block">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary text-white">
          <Icon className="h-6 w-6" />
        </div>
        <span className="text-sm font-bold text-gold sm:mt-3 sm:block">Langkah {index}</span>
      </div>
      <div>
        <h3 className="font-bold text-ink">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function DashboardPreview({ type }: { type: 'student' | 'teacher' }) {
  const isStudent = type === 'student';
  const metrics = isStudent
    ? [
        ['Modul Selesai', '12'],
        ['Kuis Dikerjakan', '18'],
        ['Skor Rata-rata', '82%'],
      ]
    : [
        ['Kelas Aktif', '8'],
        ['Siswa Aktif', '236'],
        ['Penyelesaian', '87%'],
      ];

  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-primary/10 bg-white shadow-soft">
      <div className="border-b border-primary/10 bg-mint/55 px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-bold text-ink">{isStudent ? 'Dashboard Siswa' : 'Dashboard Guru'}</p>
            <p className="text-xs text-muted-foreground">
              {isStudent ? 'Belajar terarah, progress terlihat' : 'Kelola kelas, pantau, dan bimbing'}
            </p>
          </div>
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-primary shadow-sm">
            {isStudent ? <BookOpen className="h-5 w-5" /> : <Users className="h-5 w-5" />}
          </div>
        </div>
      </div>

      <div className="p-5">
        <div className="grid grid-cols-3 divide-x divide-border rounded-2xl border border-border bg-background text-center">
          {metrics.map(([label, value]) => (
            <div key={label} className="px-2 py-3">
              <p className="text-lg font-extrabold text-primary">{value}</p>
              <p className="mt-1 text-[11px] font-medium text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 space-y-4">
          <ProgressBar value={isStudent ? 68 : 87} label={isStudent ? 'Progress Belajar' : 'Rata-rata Kelas'} showValue />
          <div className="space-y-3">
            {(isStudent
              ? ['Toleransi dalam Islam', 'Akhlak dalam Kehidupan', 'Refleksi harian terkumpul']
              : ['Kelas 8A menyelesaikan kuis', 'Modul baru dipublikasikan', 'Laporan kelas siap diunduh']
            ).map((item, index) => (
              <div key={item} className="flex items-center gap-3 border-t border-border pt-3 text-sm">
                <div className="grid h-8 w-8 place-items-center rounded-xl bg-mint text-primary">
                  {index + 1}
                </div>
                <span className="min-w-0 flex-1 truncate font-medium text-foreground">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
