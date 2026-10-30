import { ArrowRight, CheckCircle2, Clock3, PenLine } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';
import { ProgressBar } from '@/components/shared/progress-bar';
import { SectionCard } from '@/components/shared/section-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { ReflectionModuleJumpSelect } from '@/components/student/reflection-module-jump-select';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/date';
import type { ReflectionCenterData, ReflectionCenterItem } from '@/lib/student/reflection';

export function StudentReflectionCenterView({ data, basePath = '/student' }: { data: ReflectionCenterData; basePath?: string }) {
  return (
    <div>
      <PageHeader eyebrow="Pusat Refleksi" title="Refleksi" description="Pilih modul untuk menulis, melanjutkan, atau meninjau refleksi dan aksi nyata." />
      <div className="mt-8 grid gap-5 sm:grid-cols-3">
        <SummaryCard label="Belum Selesai" value={data.pending.length} icon={Clock3} />
        <SummaryCard label="Sudah Selesai" value={data.completed.length} icon={CheckCircle2} />
        <SummaryCard label="Total Modul" value={data.modules.length} icon={PenLine} />
      </div>
      <div className="mt-8"><ReflectionModuleJumpSelect modules={data.modules} basePath={basePath} /></div>
      <div className="mt-8 grid gap-8">
        <ReflectionSection title="Belum Selesai" description="Modul yang belum memiliki refleksi valid.">
          {data.pending.length ? <div className="grid items-start gap-4 lg:grid-cols-2">{data.pending.map((item) => <ReflectionTaskCard key={item.id} item={item} basePath={basePath} />)}</div> : <EmptyState icon={CheckCircle2} title="Semua refleksi sudah selesai" description="Refleksi baru akan muncul saat ada modul baru yang tersedia." className="min-h-52" />}
        </ReflectionSection>
        <ReflectionSection title="Sudah Selesai" description="Refleksi yang sudah kamu kumpulkan dan bisa diedit kembali.">
          {data.completed.length ? <div className="grid items-start gap-4 lg:grid-cols-2">{data.completed.map((item) => <ReflectionTaskCard key={item.id} item={item} completed basePath={basePath} />)}</div> : <EmptyState icon={PenLine} title="Belum ada refleksi selesai" description="Setelah refleksi dan aksi nyata disimpan, datanya akan tampil di sini." className="min-h-52" />}
        </ReflectionSection>
      </div>
    </div>
  );
}

function ReflectionTaskCard({ item, completed = false, basePath }: { item: ReflectionCenterItem; completed?: boolean; basePath: string }) {
  const href = basePath === '/student' ? item.ctaHref : item.eligible || completed ? `${basePath}/reflection?moduleId=${encodeURIComponent(item.id)}` : item.ctaHref;
  return (
    <SectionCard>
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={item.status} />
              <span className={item.eligible ? 'rounded-full bg-mint px-3 py-1 text-xs font-bold text-primary' : 'rounded-full bg-cream px-3 py-1 text-xs font-bold text-gold'}>{item.eligible ? 'Siap refleksi' : item.blockedReason}</span>
            </div>
            <h3 className="mt-3 line-clamp-2 text-lg font-extrabold text-ink">{item.title}</h3>
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
          </div>
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-mint text-primary">{completed ? <CheckCircle2 className="h-6 w-6" /> : <PenLine className="h-6 w-6" />}</div>
        </div>
        <div><div className="mb-2 flex justify-between text-xs font-bold text-muted-foreground"><span>Progress modul</span><span>{item.progress}%</span></div><ProgressBar value={item.progress} /></div>
        {completed && <div className="rounded-2xl border border-border bg-background p-4"><p className="text-xs font-bold text-primary">{item.reviewedAt ? 'Sudah ditinjau' : 'Menunggu tinjauan guru'}</p>{item.createdAt && <p className="mt-1 text-xs text-muted-foreground">Disimpan {formatDateTime(item.createdAt)}</p>}{item.reviewedAt && <p className="mt-1 text-xs text-muted-foreground">Ditinjau {formatDateTime(item.reviewedAt)}</p>}{item.teacherNote && <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">Catatan guru: {item.teacherNote}</p>}</div>}
        <div className="flex flex-col items-start gap-3 border-t border-border pt-4">
          <p className="text-sm leading-6 text-muted-foreground">{completed ? 'Kamu bisa melihat dan memperbarui refleksi ini.' : item.eligible ? 'Refleksi akan tersimpan setelah validasi berhasil.' : item.blockedReason ? `${item.blockedReason}.` : 'Selesaikan syarat terlebih dahulu sebelum menulis refleksi.'}</p>
          <Button asChild variant={item.eligible ? 'default' : 'outline'} className="h-auto min-h-11 max-w-full justify-start whitespace-normal px-4 py-3 text-left"><Link href={href}>{item.ctaLabel}<ArrowRight className="h-4 w-4 shrink-0" /></Link></Button>
        </div>
      </div>
    </SectionCard>
  );
}

function ReflectionSection({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return <section><div className="mb-4"><h2 className="text-xl font-extrabold text-ink">{title}</h2><p className="mt-1 text-sm text-muted-foreground">{description}</p></div>{children}</section>;
}

function SummaryCard({ label, value, icon: Icon }: { label: string; value: number; icon: LucideIcon }) {
  return <SectionCard className="p-4"><div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-mint text-primary"><Icon className="h-5 w-5" /></div><div><p className="text-2xl font-extrabold text-ink">{value}</p><p className="text-xs font-semibold text-muted-foreground">{label}</p></div></div></SectionCard>;
}
