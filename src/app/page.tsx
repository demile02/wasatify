import {
  BarChart3,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  PlayCircle,
  Presentation,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { PublicContainer } from '@/components/layout/public-container';
import { PublicHeader } from '@/components/layout/public-header';
import { InstallAppPrompt } from '@/components/pwa/install-app-prompt';
import { FeatureCard } from '@/components/shared/feature-card';
import { Button } from '@/components/ui/button';
import { getRoleDashboardPath } from '@/lib/auth/roles';
import { landingFeatures, publicNavigation } from '@/lib/constants/navigation';
import { getCurrentProfile } from '@/lib/auth/server';
import {
  AudienceCard,
  HeroDashboardPreview,
  SectionHeading,
} from '@/components/landing/landing-sections';

const featureIconMap = {
  BookOpen,
  CheckCircle2,
  ShieldCheck,
  BarChart3,
};

export default async function HomePage() {
  const profile = await getCurrentProfile();

  if (profile) {
    redirect(getRoleDashboardPath(profile.role));
  }

  return (
    <main className="min-h-screen overflow-x-clip bg-background text-foreground">
      <PublicHeader />

      <section
        id="beranda"
        className="relative border-b border-primary/10 bg-[linear-gradient(140deg,hsl(var(--background))_0%,hsl(var(--cream))_48%,hsl(var(--mint))_100%)]"
      >
        <PublicContainer className="grid min-h-[calc(100vh-5rem)] items-center gap-10 py-10 sm:gap-12 sm:py-14 lg:grid-cols-[0.94fr_1.06fr] lg:py-20">
          <div>
            <h1 className="max-w-4xl text-3xl font-extrabold leading-tight tracking-normal text-ink sm:text-4xl lg:text-6xl">
              Belajar Islam Wasathiyah, Lebih <span className="text-gold">Mudah</span> dan Bermakna
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:mt-6 sm:text-lg sm:leading-8">
              Ruang belajar untuk siswa dan guru: pelajari materi, uji pemahaman,
              lalu hubungkan nilai Islam Wasathiyah dengan tindakan sehari-hari.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/register">
                  <BookOpen className="h-5 w-5" />
                  Mulai Belajar
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/demo">
                  <PlayCircle className="h-5 w-5" />
                  Lihat Demo
                </Link>
              </Button>
            </div>

            <InstallAppPrompt compact className="mt-4 max-w-xl sm:mt-5" />
          </div>

          <HeroDashboardPreview />
        </PublicContainer>
      </section>

      <PublicContainer as="section" id="fitur" className="py-12 sm:py-16 lg:py-20">
        <SectionHeading
          eyebrow="Fitur utama"
          title="Satu alur untuk memahami, mencoba, dan merefleksikan"
          description="Setiap fitur disusun untuk membantu siswa memahami nilai Islam Wasathiyah dan membantu guru memantau perkembangan kelas."
        />
        <div className="mt-8 grid gap-4 sm:mt-10 sm:gap-5 md:grid-cols-2 lg:grid-cols-4">
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
      </PublicContainer>

      <PublicContainer as="section" id="untuk-siapa" className="py-12 sm:py-16 lg:py-20">
        <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-start lg:gap-10">
          <div>
            <p className="text-sm font-semibold text-gold">Untuk siapa</p>
            <h2 className="mt-3 text-3xl font-extrabold leading-tight text-ink sm:text-4xl">
              Ruang Belajar untuk Siswa dan Guru
            </h2>
            <p className="mt-4 text-base leading-8 text-muted-foreground">
              Siswa belajar mandiri melalui materi dan kuis. Guru mengelola kelas dan meninjau
              aktivitas belajar melalui ruang kerja sesuai perannya.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <AudienceCard title="Untuk siswa" description="Buka materi, kerjakan kuis, dan tulis refleksi belajar." icon={GraduationCap} />
            <AudienceCard title="Untuk guru" description="Kelola materi dan kelas, lalu tinjau aktivitas pembelajaran." icon={Presentation} />
          </div>
        </div>
      </PublicContainer>

      <PublicContainer as="section" id="tentang" className="border-t border-primary/10 py-12 sm:py-16 lg:py-20">
        <SectionHeading
          eyebrow="Tentang WASATIFY"
          title="Wasathiyah Smart Learning for Youth"
          description="WASATIFY adalah ruang belajar digital untuk membantu siswa memahami Islam Wasathiyah melalui materi, kuis, dan refleksi, sekaligus membantu guru mengelola pembelajaran kelas."
        />
      </PublicContainer>

      <footer className="border-t border-primary/10 bg-white">
        <PublicContainer className="py-8 lg:py-9">
          <div className="grid gap-8 sm:grid-cols-[1fr_auto] sm:items-start">
            <div>
              <p className="font-bold text-ink">Bantuan &amp; kontak</p>
              <p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
                Untuk bantuan akun atau akses kelas, hubungi guru kelas atau administrator sekolah.
                Siswa dan guru dapat masuk melalui halaman WASATIFY.
              </p>
              <Link href="/login" className="mt-3 inline-flex min-h-11 items-center font-semibold text-primary hover:text-dark-emerald">
                Masuk ke WASATIFY
              </Link>
            </div>
            <nav aria-label="Navigasi footer" className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground sm:justify-end">
              {publicNavigation.map((item) => (
                <Link key={item.label} href={item.href} className="inline-flex min-h-11 items-center transition hover:text-primary">
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <p className="mt-6 text-center text-xs leading-5 text-muted-foreground">
            (c) 2026 WASATIFY. Wasathiyah Smart Learning for Youth.
          </p>
        </PublicContainer>
      </footer>
    </main>
  );
}
