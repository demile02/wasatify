import { Award, BookOpenCheck, CheckCircle2, ClipboardCheck, Flame, Lock, MessageSquareText, Star } from 'lucide-react';
import Link from 'next/link';
import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';
import { ProgressBar } from '@/components/shared/progress-bar';
import { SectionCard } from '@/components/shared/section-card';
import { StatCard } from '@/components/shared/stat-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { requireStudent } from '@/lib/auth/server';
import { demoStudentProfile } from '@/lib/demo/student';
import { getStudentProgressData, type ProgressActivity } from '@/lib/student/progress';

export default async function StudentProgressPage() {
  const profile = (await requireStudent()) ?? demoStudentProfile;
  const progressData = await getStudentProgressData(profile.id);

  return (
    <div>
      <PageHeader
        eyebrow="Progress dan Pencapaian"
        title="Progress & Pencapaian"
        description="Pantau perkembangan belajarmu dan raih pencapaian terbaik."
      />

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <StatCard
          label="Progress Belajar"
          value={`${progressData.overallProgress}%`}
          description={`${progressData.totalCompletedModules} dari ${progressData.totalModules} modul selesai`}
          icon={Star}
        />
        <StatCard label="XP Terkumpul" value={formatNumber(progressData.xp)} description="Dari aktivitas belajar" icon={Award} tone="gold" />
        <StatCard label="Streak Belajar" value={`${progressData.streakDays} hari`} description="Aktivitas beruntun" icon={Flame} />
        <StatCard label="Modul Selesai" value={progressData.totalCompletedModules} description="Status completed" icon={BookOpenCheck} tone="mint" />
        <StatCard label="Kuis Dikerjakan" value={progressData.totalQuizAttempts} description="Attempt tersimpan" icon={ClipboardCheck} tone="gold" />
        <StatCard label="Refleksi" value={progressData.totalReflections} description={`${progressData.reflectionModuleCount} modul`} icon={MessageSquareText} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_0.72fr]">
        <SectionCard>
          <ProgressBar value={progressData.overallProgress} label="Progress keseluruhan" showValue />

          {progressData.modules.length ? (
            <div className="mt-6 space-y-4">
              {progressData.modules.map((moduleItem) => (
                <div key={moduleItem.id} className="rounded-2xl border border-border bg-white p-4">
                  <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground">{moduleItem.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{moduleItem.estimatedMinutes} menit estimasi</p>
                    </div>
                    <StatusBadge status={moduleItem.status} />
                  </div>
                  <ProgressBar value={moduleItem.progress} showValue />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              className="mt-6"
              icon={BookOpenCheck}
              title="Belum ada progress modul"
              description="Progress akan muncul setelah kamu mulai belajar modul published."
            />
          )}
        </SectionCard>

        <SectionCard>
          <div className="flex items-center justify-between gap-3">
            <p className="font-bold text-ink">Badge Terbaru</p>
            <span className="text-xs font-semibold text-muted-foreground">
              {progressData.badges.filter((badge) => badge.unlocked).length} / {progressData.badges.length} badge
            </span>
          </div>

          {progressData.badges.length ? (
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              {progressData.badges.slice(0, 4).map((badge) => (
                <div
                  key={`${badge.id}-${badge.earnedAt ?? 'locked'}`}
                  className={`rounded-2xl border border-border bg-white p-4 text-center ${badge.unlocked ? '' : 'opacity-60'}`}
                >
                  <div className={`mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl ${badge.unlocked ? 'bg-cream text-gold' : 'bg-slate-100 text-muted-foreground'}`}>
                    {badge.unlocked ? <Award className="h-7 w-7" /> : <Lock className="h-7 w-7" />}
                  </div>
                  <p className="text-sm font-bold text-ink">{badge.title}</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{badge.description}</p>
                  <p className="mt-2 text-xs font-bold text-primary">
                    {badge.unlocked ? `+${badge.xpReward} XP` : 'Terkunci'}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              className="mt-5 min-h-56"
              icon={Award}
              title="Belum ada badge"
              description="Badge akan tampil setelah pencapaianmu tercatat."
            />
          )}
        </SectionCard>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.84fr_1fr]">
        <SectionCard>
          <div className="flex items-center justify-between gap-3">
            <p className="font-bold text-ink">Modul Selesai</p>
            <span className="text-xs font-semibold text-muted-foreground">{progressData.completedModules.length} selesai</span>
          </div>

          {progressData.completedModules.length ? (
            <div className="mt-5 space-y-3">
              {progressData.completedModules.map((moduleItem) => (
                <Link
                  key={moduleItem.id}
                  href={`/student/modules/${moduleItem.id}`}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-white p-4 transition hover:border-primary/25 hover:bg-mint/30"
                >
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary text-white">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 font-bold text-ink">{moduleItem.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Selesai {moduleItem.completedAt ? formatDate(moduleItem.completedAt) : 'tersimpan'}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              className="mt-5 min-h-56"
              icon={BookOpenCheck}
              title="Belum ada modul selesai"
              description="Selesaikan kuis modul untuk menandai modul sebagai selesai."
              action={
                <Button asChild>
                  <Link href="/student/modules">Buka Modul</Link>
                </Button>
              }
            />
          )}
        </SectionCard>

        <SectionCard>
          <div className="flex items-center justify-between gap-3">
            <p className="font-bold text-ink">Aktivitas Terbaru</p>
            <span className="text-xs font-semibold text-muted-foreground">{progressData.activities.length} aktivitas</span>
          </div>

          {progressData.activities.length ? (
            <div className="mt-5 space-y-3">
              {progressData.activities.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))}
            </div>
          ) : (
            <EmptyState
              className="mt-5 min-h-56"
              icon={MessageSquareText}
              title="Belum ada aktivitas"
              description="Aktivitas kuis, refleksi, dan modul selesai akan tampil di sini."
            />
          )}
        </SectionCard>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_0.72fr]">
        <SectionCard>
          <div className="flex items-center justify-between gap-3">
            <p className="font-bold text-ink">Riwayat Kuis</p>
            <span className="text-xs font-semibold text-muted-foreground">{progressData.quizHistory.length} terbaru</span>
          </div>

          {progressData.quizHistory.length ? (
            <div className="mt-5 space-y-3">
              {progressData.quizHistory.map((attempt) => (
                <div key={attempt.id} className="flex items-center gap-3 rounded-2xl border border-border bg-white p-4">
                  <div className={attempt.passed ? 'grid h-11 w-11 place-items-center rounded-2xl bg-mint text-primary' : 'grid h-11 w-11 place-items-center rounded-2xl bg-cream text-gold'}>
                    <ClipboardCheck className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 font-bold text-ink">{attempt.moduleTitle}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{attempt.quizTitle}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-extrabold text-primary">{attempt.score}</p>
                    <p className="text-xs text-muted-foreground">{attempt.passed ? 'Lulus' : 'Belum lulus'}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              className="mt-5 min-h-56"
              icon={ClipboardCheck}
              title="Belum ada riwayat kuis"
              description="Riwayat kuis akan tampil setelah kamu menyelesaikan evaluasi modul."
            />
          )}
        </SectionCard>

        <SectionCard variant="muted">
          <p className="font-bold text-ink">Status Refleksi</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Kamu sudah mengumpulkan refleksi untuk {progressData.reflectionModuleCount} modul. Refleksi membantu
            menghubungkan materi dengan tindakan nyata.
          </p>
          <ProgressBar
            value={progressData.totalModules ? Math.round((progressData.reflectionModuleCount / progressData.totalModules) * 100) : 0}
            label="Cakupan refleksi"
            showValue
            className="mt-5"
          />
          <Button asChild className="mt-5 w-full">
            <Link href="/student/reflection">Tulis Refleksi</Link>
          </Button>
        </SectionCard>
      </div>
    </div>
  );
}

function ActivityItem({ activity }: { activity: ProgressActivity }) {
  const Icon = activity.type === 'quiz' ? Award : activity.type === 'reflection' ? MessageSquareText : CheckCircle2;
  const toneClass =
    activity.type === 'quiz' ? 'bg-gold/10 text-gold' : activity.type === 'reflection' ? 'bg-mint text-primary' : 'bg-primary text-white';

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-border bg-white p-4">
      <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${toneClass}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-ink">{activity.title}</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{activity.description}</p>
      </div>
      <p className="shrink-0 text-xs font-semibold text-muted-foreground">{formatDate(activity.date)}</p>
    </div>
  );
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('id-ID').format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
  }).format(new Date(value));
}
