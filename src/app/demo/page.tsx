import { GraduationCap, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthShell } from '@/components/auth/auth-shell';
import { SectionCard } from '@/components/shared/section-card';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Masuk Demo | WASATIFY',
  description: 'Masuk langsung ke ruang demo siswa atau guru WASATIFY dan coba fitur interaktifnya.',
};

export default function DemoPage() {
  return (
    <AuthShell
      title="Masuk dan coba WASATIFY"
      description="Pilih peran untuk langsung masuk ke ruang demo. Semua data hanyalah contoh. Perubahan hanya tersimpan di browser kamu."
      redirectGuard={false}
      desktopAction={
        <Button asChild variant="ghost" size="default" className="shrink-0 px-3">
          <Link href="/">Beranda</Link>
        </Button>
      }
    >
      <div className="grid min-w-0 gap-5" role="group" aria-label="Pilih peran demo">
        <DemoRoleCard
          icon={GraduationCap}
          title="Demo siswa"
          description="Klik untuk masuk ke demo siswa. Buka materi, tandai lesson selesai, kerjakan kuis, simpan refleksi, dan lihat progress."
          href="/demo/students"
          tone="student"
        />
        <DemoRoleCard
          icon={Users}
          title="Demo guru"
          description="Klik untuk masuk ke demo guru. Lihat kelas dan siswa, terbitkan modul contoh, buat pengumuman, serta tinjau laporan."
          href="/demo/teacher"
          tone="teacher"
        />
      </div>
    </AuthShell>
  );
}

function DemoRoleCard({
  icon: Icon,
  title,
  description,
  href,
  tone,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
  tone: 'student' | 'teacher';
}) {
  return (
    <Link
      href={href}
      aria-labelledby={`demo-role-${tone}-title`}
      aria-describedby={`demo-role-${tone}-description`}
      className="group block rounded-[1.25rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    >
      <SectionCard
        as="article"
        className={`h-full p-5 transition-colors duration-150 sm:p-7 ${
          tone === 'student'
            ? 'group-hover:border-primary/30 group-hover:bg-mint group-active:bg-mint'
            : 'group-hover:border-gold/40 group-hover:bg-cream group-active:bg-cream'
        }`}
      >
        <div className="flex items-start gap-4">
          <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${tone === 'student' ? 'bg-mint text-primary' : 'bg-cream text-gold'}`}>
            <Icon className="h-6 w-6" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 id={`demo-role-${tone}-title`} className="text-xl font-extrabold text-ink sm:text-2xl">{title}</h2>
            <p id={`demo-role-${tone}-description`} className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
          </div>
        </div>
      </SectionCard>
    </Link>
  );
}
