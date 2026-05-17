import { Bell, BookOpen, ClipboardCheck, Flame, MonitorPlay, Trophy } from 'lucide-react';
import Link from 'next/link';
import { EmptyState } from '@/components/shared/empty-state';
import { ModuleCard } from '@/components/shared/module-card';
import { PageHeader } from '@/components/shared/page-header';
import { ProgressBar } from '@/components/shared/progress-bar';
import { SectionCard } from '@/components/shared/section-card';
import { StatCard } from '@/components/shared/stat-card';
import { Button } from '@/components/ui/button';
import { requireStudent } from '@/lib/auth/server';
import { demoStudentProfile } from '@/lib/demo/student';
import { getStudentDashboardData } from '@/lib/student/data';

export default async function StudentDashboardPage() {
  const profile = (await requireStudent()) ?? demoStudentProfile;
  const dashboard = await getStudentDashboardData(profile);
  const modules = dashboard.modules;
  const completedCount = modules.filter((moduleItem) => moduleItem.status === 'completed').length;
  const averageProgress = modules.length
    ? Math.round(modules.reduce((total, moduleItem) => total + moduleItem.progress, 0) / modules.length)
    : 0;
  const activeModule =
    modules.find((moduleItem) => moduleItem.status === 'in_progress') ??
    modules.find((moduleItem) => moduleItem.status === 'not_started') ??
    modules.find((moduleItem) => moduleItem.status !== 'completed' && moduleItem.status !== 'locked') ??
    modules[0];
  const recommendedModules = modules.filter((moduleItem) => moduleItem.status !== 'completed').slice(0, 3);

  return (
    <div>
      <PageHeader
        eyebrow="Dashboard Siswa"
        title={`Assalamu'alaikum, ${profile.full_name} 👋`}
        description="Lanjutkan pembelajaran Islam Wasathiyah dan pantau perkembangan belajarmu secara ringkas."
      />

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Modul Selesai" value={completedCount} description={`dari ${modules.length} modul`} icon={BookOpen} />
        <StatCard label="Kuis Dikerjakan" value={dashboard.quizAttemptsCount} description="attempt tercatat" icon={ClipboardCheck} tone="gold" />
        <StatCard label="Streak Belajar" value={`${dashboard.streakDays} hari`} description="belajar konsisten" icon={Flame} />
        <StatCard label="Poin Saya" value={dashboard.points.toLocaleString('id-ID')} description="total poin" icon={Trophy} tone="mint" />
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
          <div className="mt-6 grid gap-6 xl:grid-cols-[1.18fr_0.82fr]">
            <SectionCard className="overflow-hidden p-0">
              <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
                <div className="relative overflow-hidden bg-dark-emerald p-6 text-white">
                  <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
                  <p className="text-sm font-semibold text-gold">Lanjutkan Belajar</p>
                  <h2 className="mt-3 text-2xl font-extrabold">{activeModule.title}</h2>
                  <p className="mt-3 text-sm leading-6 text-white/75">{activeModule.description}</p>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-white/80">
                    <span className="rounded-full bg-white/12 px-3 py-1">{activeModule.lessonsCount} pelajaran</span>
                    <span className="rounded-full bg-white/12 px-3 py-1">{activeModule.estimatedMinutes} menit</span>
                  </div>
                  <ProgressBar
                    value={activeModule.progress}
                    showValue
                    className="mt-6"
                    trackClassName="bg-white/18"
                    indicatorClassName="bg-gold"
                  />
                  <Button asChild variant="gold" className="mt-6">
                    <Link href={`/student/modules/${activeModule.id}`}>Lanjutkan Belajar</Link>
                  </Button>
                </div>

                <div className="grid min-h-72 place-items-center bg-[linear-gradient(135deg,hsl(var(--cream)),hsl(var(--mint)))] p-6">
                  <div className="relative h-56 w-full max-w-sm rounded-[2rem] border border-primary/10 bg-white/75 p-5 shadow-card">
                    <div className="absolute left-8 top-8 h-20 w-20 rounded-full bg-primary/10" />
                    <div className="absolute right-8 top-10 h-16 w-16 rounded-full bg-gold/15" />
                    <div className="relative mx-auto mt-8 grid h-24 w-24 place-items-center rounded-[2rem] bg-primary text-white shadow-card">
                      <MonitorPlay className="h-12 w-12" />
                    </div>
                    <div className="mx-auto mt-6 h-3 w-3/4 rounded-full bg-primary/20" />
                    <div className="mx-auto mt-3 h-3 w-1/2 rounded-full bg-gold/25" />
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard>
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="font-bold text-ink">Pengumuman</p>
                <Bell className="h-5 w-5 text-gold" />
              </div>
              {dashboard.announcements.length ? (
                <div className="space-y-4">
                  {dashboard.announcements.map((announcement) => (
                    <div key={announcement.title} className="border-b border-border pb-4 last:border-0 last:pb-0">
                      <p className="text-sm font-bold text-foreground">{announcement.title}</p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">{announcement.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  className="min-h-40 bg-mint/35"
                  icon={Bell}
                  title="Belum ada pengumuman"
                  description="Pengumuman global atau kelas akan tampil di sini."
                />
              )}
            </SectionCard>
          </div>

          <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_0.55fr]">
            <div>
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-xl font-extrabold text-ink">Rekomendasi Modul</h2>
                <Link href="/student/modules" className="text-sm font-bold text-primary">
                  Lihat semua
                </Link>
              </div>
              {recommendedModules.length ? (
                <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
                  {recommendedModules.map((moduleItem) => (
                    <ModuleCard key={moduleItem.id} {...moduleItem} href={`/student/modules/${moduleItem.id}`} />
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
              <p className="font-bold text-ink">Ringkasan Aktivitas</p>
              <div className="mt-5 space-y-5">
                <ProgressBar value={averageProgress} label="Progress Belajar" showValue />
                {dashboard.activities.length ? (
                  <div className="space-y-4">
                    {dashboard.activities.map((activity) => (
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
