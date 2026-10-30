'use client';

import { BookOpen, ClipboardCheck, Flame, MonitorPlay, Trophy } from 'lucide-react';
import Link from 'next/link';
import { CroppedImage } from '@/components/shared/cropped-image';
import { EmptyState } from '@/components/shared/empty-state';
import { ModuleCard } from '@/components/shared/module-card';
import { PageHeader } from '@/components/shared/page-header';
import { ProgressBar } from '@/components/shared/progress-bar';
import { SectionCard } from '@/components/shared/section-card';
import { StatCard } from '@/components/shared/stat-card';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/date';
import type { StudentDashboardData } from '@/lib/student/data';
import type { Profile, StudentLearningModule } from '@/lib/types';

export function StudentDashboardView({
  profile,
  dashboard,
  basePath = '/student',
}: {
  profile: Profile;
  dashboard: StudentDashboardData;
  basePath?: string;
}) {
  const modules = dashboard.modules;
  const completedCount = modules.filter((moduleItem) => moduleItem.status === 'completed').length;
  const averageProgress = modules.length
    ? Math.round(modules.reduce((total, moduleItem) => total + moduleItem.progress, 0) / modules.length)
    : 0;
  const continueModule =
    modules.find((moduleItem) => moduleItem.status === 'in_progress') ??
    modules.find((moduleItem) => moduleItem.status === 'not_started');
  const recommendedModules = modules.slice(0, 3);

  return (
    <div>
      <PageHeader
        title={`Assalamu'alaikum, ${profile.full_name} 👋`}
      />

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Modul Selesai" value={completedCount} description={`dari ${modules.length} modul`} icon={BookOpen} singleLine />
        <StatCard label="Kuis Dikerjakan" value={dashboard.quizAttemptsCount} description="attempt tercatat" icon={ClipboardCheck} tone="gold" singleLine />
        <StatCard label="Streak Belajar" value={`${dashboard.streakDays} hari`} description="belajar konsisten" icon={Flame} singleLine />
        <StatCard label="Poin Saya" value={dashboard.points.toLocaleString('id-ID')} description="total poin" icon={Trophy} tone="mint" singleLine />
      </div>

      {modules.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={BookOpen}
          title="Belum ada modul tersedia"
          description="Kamu belum tergabung dalam kelas, atau guru kelasmu belum mempublikasikan modul."
        />
      ) : (
        <>
          <div className="mt-6 grid items-start gap-6">
            {continueModule ? (
              <ContinueLearningCard moduleItem={continueModule} basePath={basePath} />
            ) : (
              <CompletionCard completedCount={completedCount} basePath={basePath} />
            )}
          </div>

          <div className="mt-8 grid items-start gap-6 xl:grid-cols-[1fr_0.55fr]">
            <div>
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-xl font-extrabold text-ink">Rekomendasi Modul</h2>
                <Link href={`${basePath}/modules`} className="inline-flex min-h-11 shrink-0 items-center px-2 text-sm font-bold text-primary">
                  Lihat semua
                </Link>
              </div>
              {recommendedModules.length ? (
                <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
                  {recommendedModules.map((moduleItem) => (
                    <ModuleCard
                      key={moduleItem.id}
                      {...moduleItem}
                      imageVariant="hero"
                      imageCropConfig={moduleItem.imageCropConfig}
                      href={`${basePath}/modules/${moduleItem.slug || moduleItem.id}`}
                      statusLabel={getDashboardModuleStatusLabel(moduleItem)}
                      metaText={getDashboardModuleMeta(moduleItem)}
                      actionLabel={getDashboardModuleActionLabel(moduleItem)}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Trophy}
                  title="Semua modul sudah selesai"
                  description="Capaianmu akan tetap tersimpan. Modul baru akan muncul saat guru mempublikasikannya."
                />
              )}
            </div>

            <SectionCard>
              <div className="flex items-center justify-between gap-3">
                <p className="font-bold text-ink">Ringkasan Aktivitas</p>
                <Link href={`${basePath}/progress`} className="inline-flex min-h-11 shrink-0 items-center px-2 text-sm font-bold text-primary">
                  Lihat semua
                </Link>
              </div>
              <div className="mt-5 space-y-5">
                <ProgressBar value={averageProgress} label="Progress Belajar" showValue />
                {dashboard.activities.length ? (
                  <div className="space-y-4">
                    {dashboard.activities.slice(0, 3).map((activity) => (
                      <div key={`${activity.title}-${activity.time}`} className="flex items-start gap-3 border-t border-border pt-4">
                        <span className="mt-1 h-2.5 w-2.5 rounded-full bg-primary" />
                        <div>
                          <p className="text-sm font-semibold text-foreground">{activity.title}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    className="min-h-40 bg-mint/35"
                    icon={ClipboardCheck}
                    title="Belum ada aktivitas"
                    description="Aktivitas kuis, refleksi, dan progress modul akan muncul setelah kamu mulai belajar."
                  />
                )}
              </div>
            </SectionCard>
          </div>
        </>
      )}
    </div>
  );
}

function ContinueLearningCard({ moduleItem, basePath }: { moduleItem: StudentLearningModule; basePath: string }) {
  const configuredCrop = moduleItem.imageCropConfig;
  const heroImage = configuredCrop ? moduleItem.imageSrc : moduleItem.heroImageSrc || moduleItem.imageSrc;

  return (
    <SectionCard padded={false} className="relative overflow-hidden p-0">
      <p className="absolute left-6 top-4 z-10 text-sm font-semibold text-gold">
        Lanjutkan Belajar
      </p>
      <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="relative order-1 aspect-[16/9] self-center overflow-hidden bg-mint lg:col-start-2 lg:row-start-1 lg:aspect-[4/3] lg:self-start">
          {heroImage ? (
            <div className="absolute inset-0 overflow-hidden">
              {configuredCrop ? (
                <>
                  <div className="absolute inset-0 lg:hidden">
                    <CroppedImage src={heroImage} crop={configuredCrop.heroMobile} sizes="100vw" />
                  </div>
                  <div className="absolute inset-0 hidden lg:block">
                    <CroppedImage src={heroImage} crop={configuredCrop.heroDesktop} sizes="(min-width: 1280px) 28vw, (min-width: 1024px) 45vw" />
                  </div>
                </>
              ) : (
                <CroppedImage src={heroImage} loading="eager" sizes="(min-width: 1280px) 28vw, (min-width: 768px) 45vw, 100vw" />
              )}
            </div>
          ) : (
            <div className="absolute inset-0 overflow-hidden bg-white/75 p-5">
              <div className="absolute left-8 top-8 h-20 w-20 rounded-full bg-primary/10" />
              <div className="absolute right-8 top-10 h-16 w-16 rounded-full bg-gold/15" />
              <div className="relative mx-auto mt-8 grid h-24 w-24 place-items-center rounded-[2rem] bg-primary text-white shadow-card">
                <MonitorPlay className="h-12 w-12" />
              </div>
              <div className="mx-auto mt-6 h-3 w-3/4 rounded-full bg-primary/20" />
              <div className="mx-auto mt-3 h-3 w-1/2 rounded-full bg-gold/25" />
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-primary/55 to-transparent" />
        </div>

        <div className="relative order-2 bg-white p-6 text-ink lg:col-start-1 lg:row-start-1 lg:flex lg:flex-col lg:justify-between lg:pt-14">
          <div>
            <h2 className="mt-3 line-clamp-2 text-2xl font-extrabold lg:mt-0">{moduleItem.title}</h2>
            <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted-foreground">{moduleItem.description}</p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-muted-foreground">
              <span className="rounded-full bg-mint/45 px-3 py-1">{moduleItem.lessonsCount} pelajaran</span>
              <span className="rounded-full bg-mint/45 px-3 py-1">{moduleItem.estimatedMinutes} menit</span>
            </div>
          </div>

          <div className="mt-6 space-y-5 lg:mt-8">
            <ProgressBar value={moduleItem.progress} showValue />
            <Link
              href={`${basePath}/modules/${moduleItem.slug || moduleItem.id}`}
              className="inline-flex min-h-11 w-fit items-center rounded-sm px-3 py-2 text-sm font-bold text-primary transition-colors hover:text-dark-emerald focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {moduleItem.status === 'in_progress' ? 'Lanjutkan Belajar' : 'Mulai Belajar'}
            </Link>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

function CompletionCard({ completedCount, basePath }: { completedCount: number; basePath: string }) {
  return (
    <SectionCard className="grid min-h-72 place-items-center bg-[linear-gradient(135deg,hsl(var(--mint)),hsl(var(--cream)))]">
      <div className="max-w-xl text-center">
        <p className="text-sm font-bold text-gold">Semua modul selesai</p>
        <h2 className="mt-2 text-2xl font-extrabold text-ink">Semua modul sudah selesai. Kerja bagus!</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Kamu sudah menuntaskan {completedCount} modul yang tersedia. Progress tetap tersimpan dan modul bisa dipelajari ulang kapan saja.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild><Link href={`${basePath}/progress`}>Lihat Progress</Link></Button>
          <Button asChild variant="outline"><Link href={`${basePath}/modules`}>Pelajari Ulang Modul</Link></Button>
        </div>
      </div>
    </SectionCard>
  );
}

function getDashboardModuleStatusLabel(moduleItem: StudentLearningModule) {
  if (moduleItem.status === 'completed') return 'Sudah selesai';
  if (moduleItem.status === 'in_progress') return 'Sedang dipelajari';
  if (moduleItem.status === 'not_started') return 'Belum dimulai';
  return 'Terkunci';
}

function getDashboardModuleActionLabel(moduleItem: StudentLearningModule) {
  if (moduleItem.status === 'completed') return 'Lihat Kembali';
  if (moduleItem.status === 'in_progress') return 'Lanjutkan';
  if (moduleItem.status === 'not_started') return 'Mulai';
  return 'Selesaikan modul sebelumnya';
}

function getDashboardModuleMeta(moduleItem: StudentLearningModule) {
  if (moduleItem.status === 'completed') {
    return moduleItem.completedAt ? `Selesai ${formatDateTime(moduleItem.completedAt)}` : 'Sudah selesai';
  }

  return undefined;
}
