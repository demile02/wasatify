import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Megaphone,
  MessageSquareText,
  Plus,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';
import { ProgressBar } from '@/components/shared/progress-bar';
import { SectionCard } from '@/components/shared/section-card';
import { StatCard } from '@/components/shared/stat-card';
import { Button } from '@/components/ui/button';
import { TeacherModuleCompletionChart } from '@/components/teacher/teacher-module-completion-chart';
import { requireTeacher } from '@/lib/auth/server';
import { formatDateTime } from '@/lib/date';
import { demoTeacherProfile } from '@/lib/demo/teacher';
import { getTeacherDashboardData, type TeacherActivity } from '@/lib/teacher/data';
import { cn } from '@/lib/utils';

export default async function TeacherDashboardPage() {
  const profile = (await requireTeacher()) ?? demoTeacherProfile;
  const dashboard = await getTeacherDashboardData(profile);

  return (
    <div>
      <PageHeader
        eyebrow="Dashboard Guru"
        title={`Assalamu'alaikum, Ust. ${profile.full_name} 👋`}
        description="Berikut ringkasan aktivitas belajar dan mengajar dari kelas yang Anda kelola."
        actions={
          <Button asChild>
            <Link href="/teacher/modules/new">
              <Plus className="h-4 w-4" />
              Tambah Modul
            </Link>
          </Button>
        }
      />

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Kelas Aktif" value={dashboard.classesCount} description="Kelas dikelola" icon={Users} />
        <StatCard label="Siswa Aktif" value={dashboard.studentsCount} description="Siswa di kelas Anda" icon={Users} tone="mint" />
        <StatCard label="Kuis Dibuat" value={dashboard.quizzesCount} description="Evaluasi tersedia" icon={ClipboardCheck} tone="gold" />
        <StatCard
          label="Tingkat Penyelesaian"
          value={`${dashboard.completionRate}%`}
          description="Rata-rata progress"
          icon={BarChart3}
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_0.82fr]">
        <SectionCard>
          <div className="flex items-center justify-between gap-3">
            <p className="font-bold text-ink">Progress Kelas</p>
            <Button asChild variant="link">
              <Link href="/teacher/classes">Lihat Semua</Link>
            </Button>
          </div>

          {dashboard.classProgress.length ? (
            <div className="mt-5 space-y-4">
              {dashboard.classProgress.map((classItem) => (
                <div key={classItem.id} className="rounded-2xl border border-border bg-white p-4">
                  <div className="mb-3 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-bold text-ink">{classItem.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{classItem.studentsCount} siswa aktif</p>
                    </div>
                    <span className="text-sm font-extrabold text-primary">{classItem.progress}%</span>
                  </div>
                  <ProgressBar value={classItem.progress} />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              className="mt-5"
              icon={Users}
              title="Belum ada kelas aktif"
              description="Kelas yang Anda buat akan tampil di sini."
            />
          )}
        </SectionCard>

        <SectionCard>
          <div className="flex items-center justify-between gap-3">
            <p className="font-bold text-ink">Aktivitas Terbaru</p>
            <Button asChild variant="link">
              <Link href="/teacher/reports">Detail</Link>
            </Button>
          </div>

          {dashboard.activities.length ? (
            <div className="mt-5 space-y-3">
              {dashboard.activities.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))}
            </div>
          ) : (
            <EmptyState
              className="mt-5 min-h-56"
              icon={MessageSquareText}
              title="Belum ada aktivitas"
              description="Aktivitas siswa dari kuis, refleksi, dan progress modul akan tampil di sini."
            />
          )}
        </SectionCard>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_0.8fr]">
        <SectionCard>
          <p className="font-bold text-ink">Penyelesaian Modul</p>

          {dashboard.moduleCompletion.length ? (
            <div className="mt-6">
              <TeacherModuleCompletionChart data={dashboard.moduleCompletion} />
            </div>
          ) : (
            <EmptyState
              className="mt-5"
              icon={BookOpen}
              title="Belum ada data penyelesaian"
              description="Chart akan muncul setelah siswa mulai menyelesaikan modul."
            />
          )}
        </SectionCard>

        <SectionCard>
          <div className="flex items-center justify-between gap-3">
            <p className="font-bold text-ink">Pengumuman</p>
            <Button asChild variant="link">
              <Link href="/teacher/announcements">Kelola</Link>
            </Button>
          </div>

          {dashboard.announcements.length ? (
            <div className="mt-5 space-y-3">
              {dashboard.announcements.map((announcement) => (
                <div key={announcement.id} className="rounded-2xl border border-border bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-bold text-ink">{announcement.title}</p>
                    <PriorityBadge priority={announcement.priority} />
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{announcement.content}</p>
                  <p className="mt-2 text-xs font-semibold text-primary">
                    {formatDateTime(announcement.publishedAt ?? announcement.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              className="mt-5 min-h-56"
              icon={Megaphone}
              title="Belum ada pengumuman"
              description="Pengumuman untuk kelas akan tampil setelah dibuat."
            />
          )}
        </SectionCard>
      </div>

      <SectionCard className="mt-6">
        <p className="font-bold text-ink">Aksi Cepat</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <QuickAction href="/teacher/modules/new" icon={BookOpen} label="Tambah Modul" />
          <QuickAction href="/teacher/quizzes" icon={ClipboardCheck} label="Buat Kuis" />
          <QuickAction href="/teacher/classes" icon={Users} label="Kelola Kelas" />
          <QuickAction href="/teacher/reports" icon={FileText} label="Laporan Kelas" />
          <QuickAction href="/teacher/announcements" icon={Megaphone} label="Pengumuman" />
        </div>
      </SectionCard>
    </div>
  );
}

function ActivityItem({ activity }: { activity: TeacherActivity }) {
  const Icon = activity.type === 'quiz' ? ClipboardCheck : activity.type === 'reflection' ? MessageSquareText : CheckCircle2;
  const toneClass =
    activity.type === 'quiz' ? 'bg-gold/10 text-gold' : activity.type === 'reflection' ? 'bg-mint text-primary' : 'bg-primary text-white';

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-border bg-white p-4">
      <span className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-2xl', toneClass)}>
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold text-ink">{activity.title}</span>
        <span className="mt-1 block text-xs leading-5 text-muted-foreground">{activity.description}</span>
      </span>
      <span className="shrink-0 text-xs font-semibold text-muted-foreground">{formatDateTime(activity.date)}</span>
    </div>
  );
}

function QuickAction({ href, icon: Icon, label }: { href: string; icon: LucideIcon; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-2xl border border-border bg-white p-4 text-sm font-bold text-ink transition hover:border-primary/30 hover:bg-mint/35"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-mint text-primary">
        <Icon className="h-5 w-5" />
      </span>
      {label}
    </Link>
  );
}

function PriorityBadge({ priority }: { priority: 'low' | 'normal' | 'high' }) {
  const className =
    priority === 'high'
      ? 'border-red-200 bg-red-50 text-red-700'
      : priority === 'low'
        ? 'border-slate-200 bg-slate-50 text-slate-600'
        : 'border-primary/15 bg-mint text-primary';

  return (
    <span className={cn('rounded-full border px-2.5 py-1 text-xs font-bold', className)}>
      {priority === 'high' ? 'Penting' : priority === 'low' ? 'Rendah' : 'Info'}
    </span>
  );
}
