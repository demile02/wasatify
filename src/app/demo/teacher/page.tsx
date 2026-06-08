import { ArrowLeft, BarChart3, BookOpen, ClipboardCheck, Megaphone, Users } from 'lucide-react';
import Link from 'next/link';
import { AppLogo } from '@/components/shared/app-logo';
import { ProgressBar } from '@/components/shared/progress-bar';
import { SectionCard } from '@/components/shared/section-card';
import { Button } from '@/components/ui/button';

const classRows = [
  { name: 'VII A', students: 32, progress: 82 },
  { name: 'VII B', students: 30, progress: 64 },
  { name: 'VIII A', students: 34, progress: 76 },
];

export default function DemoTeacherPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-primary/10 bg-white/88 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <AppLogo href="/" size="sm" />
          <Button asChild variant="outline" size="sm">
            <Link href="/demo">
              <ArrowLeft className="h-4 w-4" />
              Demo
            </Link>
          </Button>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:py-14">
        <div className="mb-8 inline-flex rounded-full border border-primary/10 bg-white/78 px-4 py-2 text-sm font-bold text-primary shadow-sm">
          Ini adalah data contoh untuk pratinjau.
        </div>
        <div className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
          <div>
            <p className="text-sm font-bold text-gold">Demo guru read-only</p>
            <h1 className="mt-3 text-4xl font-extrabold leading-tight text-ink sm:text-5xl">Pusat Guru WASATIFY</h1>
            <p className="mt-4 text-base leading-8 text-muted-foreground">
              Preview statis untuk melihat gambaran dashboard guru tanpa login dan tanpa menyimpan data.
            </p>
            <Button asChild size="lg" className="mt-7">
              <Link href="/register/teacher">Daftar untuk mencoba</Link>
            </Button>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <PreviewCard icon={Users} title="Kelas Aktif" value="4" description="128 siswa aktif" />
            <PreviewCard icon={BookOpen} title="Modul Published" value="18" description="siap dipelajari siswa" />
            <PreviewCard icon={ClipboardCheck} title="Kuis Terkumpul" value="86%" description="rata-rata nilai terbaik" />
            <PreviewCard icon={Megaphone} title="Pengumuman" value="Published" description="untuk kelas tertentu" />
          </div>
        </div>

        <SectionCard className="mt-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-primary">Progress Kelas</p>
              <h2 className="mt-1 text-2xl font-extrabold text-ink">Ringkasan kelas contoh</h2>
            </div>
            <BarChart3 className="h-8 w-8 text-primary" />
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {classRows.map((classItem) => (
              <div key={classItem.name} className="rounded-2xl border border-border bg-background p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-ink">{classItem.name}</p>
                    <p className="text-xs text-muted-foreground">{classItem.students} siswa</p>
                  </div>
                  <span className="text-sm font-extrabold text-primary">{classItem.progress}%</span>
                </div>
                <ProgressBar value={classItem.progress} />
              </div>
            ))}
          </div>
        </SectionCard>
      </section>
    </main>
  );
}

function PreviewCard({
  icon: Icon,
  title,
  value,
  description,
}: {
  icon: typeof Users;
  title: string;
  value: string;
  description: string;
}) {
  return (
    <SectionCard>
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-mint text-primary">
        <Icon className="h-6 w-6" />
      </div>
      <p className="mt-5 text-sm font-bold text-primary">{title}</p>
      <h2 className="mt-1 text-2xl font-extrabold text-ink">{value}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
    </SectionCard>
  );
}
