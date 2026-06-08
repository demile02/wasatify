import { ArrowRight, CheckCircle2, Clock3, Lightbulb, Lock, PenLine } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { ReflectionForm } from '@/components/student/reflection-form';
import { ReflectionModuleJumpSelect } from '@/components/student/reflection-module-jump-select';
import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';
import { ProgressBar } from '@/components/shared/progress-bar';
import { SectionCard } from '@/components/shared/section-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { requireStudent } from '@/lib/auth/server';
import { formatDateTime } from '@/lib/date';
import { demoStudentProfile } from '@/lib/demo/student';
import {
  getReflectionCenterData,
  getReflectionPageData,
  type ReflectionCenterItem,
  type ReflectionModuleOption,
} from '@/lib/student/reflection';

type StudentReflectionPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function StudentReflectionPage({ searchParams }: StudentReflectionPageProps) {
  const query = await searchParams;
  const profile = (await requireStudent()) ?? demoStudentProfile;
  const moduleId = getSearchValue(query.moduleId);

  if (!moduleId) {
    const centerData = await getReflectionCenterData(profile.id);
    return <ReflectionCenter data={centerData} />;
  }

  const reflectionData = await getReflectionPageData(profile.id, moduleId);

  return (
    <div>
      <PageHeader
        eyebrow="Refleksi Diri"
        title="Refleksi dan Aksi"
        description="Renungkan pembelajaranmu dan wujudkan dalam tindakan nyata."
      />

      {reflectionData.locked || !reflectionData.selectedModule ? (
        <div className="mt-8 space-y-6">
          <ReflectionModuleJumpSelect modules={reflectionData.modules} selectedModuleId={reflectionData.selectedModule?.id} />
          <EmptyState
            icon={Lock}
            title={reflectionData.selectedModule ? 'Refleksi belum terbuka' : 'Modul tidak ditemukan'}
            description={reflectionData.lockedReason ?? 'Selesaikan syarat modul terlebih dahulu.'}
            action={
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild>
                  <Link href={reflectionData.lockedHref}>{reflectionData.lockedCtaLabel}</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/student/reflection">Kembali ke Refleksi</Link>
                </Button>
              </div>
            }
          />
        </div>
      ) : (
        <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_0.42fr]">
          <ReflectionForm
            modules={reflectionData.modules}
            selectedModuleId={reflectionData.selectedModule.id}
            existingReflection={reflectionData.existingReflection}
            showCancel
          />

          <ReflectionGuide selectedModule={reflectionData.selectedModule} />
        </div>
      )}
    </div>
  );
}

function ReflectionCenter({ data }: { data: Awaited<ReturnType<typeof getReflectionCenterData>> }) {
  return (
    <div>
      <PageHeader
        eyebrow="Pusat Refleksi"
        title="Refleksi"
        description="Pilih modul untuk menulis, melanjutkan, atau meninjau refleksi dan aksi nyata."
      />

      <div className="mt-8 grid gap-5 sm:grid-cols-3">
        <SummaryCard label="Belum Selesai" value={data.pending.length} icon={Clock3} />
        <SummaryCard label="Sudah Selesai" value={data.completed.length} icon={CheckCircle2} />
        <SummaryCard label="Total Modul" value={data.modules.length} icon={PenLine} />
      </div>

      <div className="mt-8">
        <ReflectionModuleJumpSelect modules={data.modules} />
      </div>

      <div className="mt-8 grid gap-8">
        <ReflectionSection title="Belum Selesai" description="Modul yang belum memiliki refleksi valid.">
          {data.pending.length ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {data.pending.map((item) => (
                <ReflectionTaskCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={CheckCircle2}
              title="Semua refleksi sudah selesai"
              description="Refleksi baru akan muncul saat ada modul baru yang tersedia."
              className="min-h-52"
            />
          )}
        </ReflectionSection>

        <ReflectionSection title="Sudah Selesai" description="Refleksi yang sudah kamu kumpulkan dan bisa diedit kembali.">
          {data.completed.length ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {data.completed.map((item) => (
                <ReflectionTaskCard key={item.id} item={item} completed />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={PenLine}
              title="Belum ada refleksi selesai"
              description="Setelah refleksi dan aksi nyata disimpan, datanya akan tampil di sini."
              className="min-h-52"
            />
          )}
        </ReflectionSection>
      </div>
    </div>
  );
}

function ReflectionTaskCard({ item, completed = false }: { item: ReflectionCenterItem; completed?: boolean }) {
  return (
    <SectionCard>
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={item.status} />
              <span className={item.eligible ? 'rounded-full bg-mint px-3 py-1 text-xs font-bold text-primary' : 'rounded-full bg-cream px-3 py-1 text-xs font-bold text-gold'}>
                {item.eligible ? 'Siap refleksi' : item.blockedReason}
              </span>
            </div>
            <h3 className="mt-3 line-clamp-2 text-lg font-extrabold text-ink">{item.title}</h3>
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
          </div>
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-mint text-primary">
            {completed ? <CheckCircle2 className="h-6 w-6" /> : <PenLine className="h-6 w-6" />}
          </div>
        </div>

        <div>
          <div className="mb-2 flex justify-between text-xs font-bold text-muted-foreground">
            <span>Progress modul</span>
            <span>{item.progress}%</span>
          </div>
          <ProgressBar value={item.progress} />
        </div>

        {completed && (
          <div className="rounded-2xl border border-border bg-background p-4">
            <p className="text-xs font-bold text-primary">
              {item.reviewedAt ? 'Sudah ditinjau' : 'Menunggu tinjauan guru'}
            </p>
            {item.createdAt && (
              <p className="mt-1 text-xs text-muted-foreground">Disimpan {formatDateTime(item.createdAt)}</p>
            )}
            {item.reviewedAt && (
              <p className="mt-1 text-xs text-muted-foreground">Ditinjau {formatDateTime(item.reviewedAt)}</p>
            )}
            {item.teacherNote && (
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
                Catatan guru: {item.teacherNote}
              </p>
            )}
          </div>
        )}

        <div className="flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-5 text-muted-foreground">
            {completed
              ? 'Kamu bisa melihat dan memperbarui refleksi ini.'
              : item.eligible
                ? 'Refleksi akan tersimpan setelah validasi berhasil.'
                : 'Selesaikan syarat terlebih dahulu sebelum menulis refleksi.'}
          </p>
          <Button asChild variant={item.eligible ? 'default' : 'outline'} className="shrink-0">
            <Link href={item.ctaHref}>
              {item.ctaLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </SectionCard>
  );
}

function ReflectionSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section>
      <div className="mb-4">
        <h2 className="text-xl font-extrabold text-ink">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
}) {
  return (
    <SectionCard className="p-4">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-mint text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-extrabold text-ink">{value}</p>
          <p className="text-xs font-semibold text-muted-foreground">{label}</p>
        </div>
      </div>
    </SectionCard>
  );
}

function ReflectionGuide({ selectedModule }: { selectedModule: ReflectionModuleOption }) {
  return (
    <div className="space-y-5">
      <SectionCard variant="muted">
        <p className="font-bold text-ink">Modul refleksi</p>
        <p className="mt-2 font-extrabold text-primary">{selectedModule.title}</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{selectedModule.description}</p>
        <ProgressBar value={selectedModule.progress} label="Progress modul" showValue className="mt-4" />
      </SectionCard>

      <SectionCard variant="muted">
        <p className="font-bold text-ink">Panduan refleksi</p>
        <ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
          <li>1. Tulis hal yang paling kamu pahami.</li>
          <li>2. Hubungkan dengan pengalaman sehari-hari.</li>
          <li>3. Pilih satu aksi kecil yang realistis.</li>
        </ul>
      </SectionCard>

      <SectionCard>
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-cream text-gold">
            <Lightbulb className="h-5 w-5" />
          </div>
          <div>
            <p className="font-bold text-ink">Aksi yang baik</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Mulai dari hal kecil dan konsisten. Setiap aksi membawa perubahan besar.
            </p>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

function getSearchValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
