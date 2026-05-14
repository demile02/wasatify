'use client';

import type { ReactNode } from 'react';
import {
  Bell,
  BookOpen,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Home,
  Mail,
  Megaphone,
  Search,
  Settings,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AppLogo } from '@/components/shared/app-logo';
import { UserAvatar } from '@/components/shared/user-avatar';
import { Button } from '@/components/ui/button';
import { teacherNavigation } from '@/lib/constants/navigation';
import type { Profile } from '@/lib/types';
import { cn } from '@/lib/utils';

type TeacherShellProps = {
  profile: Profile;
  children: ReactNode;
};

const iconMap = {
  Home,
  Users,
  BookOpen,
  ClipboardCheck,
  GraduationCap,
  FileText,
  Megaphone,
  Mail,
  Settings,
};

export function TeacherShell({ profile, children }: TeacherShellProps) {
  const pathname = usePathname() ?? '';

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col overflow-hidden bg-dark-emerald px-4 py-5 text-white shadow-soft lg:flex">
        <div className="absolute inset-x-0 bottom-0 h-72 bg-[radial-gradient(circle_at_50%_100%,rgba(201,138,26,0.25),transparent_64%)]" />
        <div className="relative px-2">
          <AppLogo href="/" size="sm" theme="dark" />
        </div>

        <nav className="relative mt-8 space-y-1.5">
          {teacherNavigation.map((item) => {
            const Icon = iconMap[item.icon as keyof typeof iconMap] ?? Home;
            const active = isActivePath(pathname, item.href, item.label);

            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition',
                  active
                    ? 'bg-white text-primary shadow-card'
                    : 'text-white/76 hover:bg-white/10 hover:text-white',
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="relative mt-auto rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
          <p className="text-sm font-bold text-white">Pusat Guru</p>
          <p className="mt-1 text-xs leading-5 text-white/70">
            Kelola kelas, modul, dan laporan belajar dari satu ruang kerja.
          </p>
          <Button asChild variant="gold" size="sm" className="mt-3 w-full">
            <Link href="/teacher/modules/new">Tambah Modul</Link>
          </Button>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-primary/10 bg-background/88 backdrop-blur-xl">
          <div className="flex min-h-20 items-center gap-3 px-5 py-3 sm:px-8">
            <div className="lg:hidden">
              <AppLogo href="/" size="sm" markOnly />
            </div>

            <div className="hidden min-w-0 lg:block">
              <p className="text-sm font-semibold text-primary">{"Assalamu'alaikum, "}{profile.full_name}</p>
              <p className="text-xs text-muted-foreground">
                {profile.subject ?? profile.school_name ?? 'Guru WASATIFY'}
              </p>
            </div>

            <div className="ml-auto hidden w-full max-w-lg items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 shadow-sm md:flex">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                aria-label="Cari data guru"
                placeholder="Cari kelas, modul, siswa, atau laporan..."
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
              />
            </div>

            <button className="relative grid h-11 w-11 place-items-center rounded-xl border border-border bg-white text-foreground shadow-sm transition hover:bg-mint">
              <Bell className="h-5 w-5" />
              <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-gold" />
            </button>

            <div className="rounded-2xl border border-border bg-white px-2 py-1.5 shadow-sm">
              <UserAvatar name={profile.full_name} imageUrl={profile.avatar_url} roleLabel="Guru" />
            </div>
          </div>

          <div className="space-y-3 border-t border-primary/10 px-5 pb-3 md:hidden">
            <div className="flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 shadow-sm">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                aria-label="Cari data guru mobile"
                placeholder="Cari kelas atau modul..."
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
              />
            </div>
            <nav className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {teacherNavigation.map((item) => {
                const Icon = iconMap[item.icon as keyof typeof iconMap] ?? Home;
                const active = isActivePath(pathname, item.href, item.label);

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={cn(
                      'inline-flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition',
                      active
                        ? 'border-primary bg-primary text-white'
                        : 'border-border bg-white text-muted-foreground',
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </header>

        <main className="px-5 py-6 sm:px-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

function isActivePath(pathname: string, href: string, label: string) {
  if (label === 'Beranda') return pathname === '/teacher' || pathname === '/teacher/dashboard';
  if (label === 'Modul') return pathname.startsWith('/teacher/modules');
  if (label === 'Kelas Saya') return pathname.startsWith('/teacher/classes');
  if (label === 'Kuis') return pathname.startsWith('/teacher/quizzes');
  if (label === 'Siswa') return pathname.startsWith('/teacher/students');
  if (label === 'Laporan') return pathname.startsWith('/teacher/reports');
  if (label === 'Pengumuman') return pathname.startsWith('/teacher/announcements');
  if (label === 'Pesan') return pathname.startsWith('/teacher/messages');
  if (label === 'Pengaturan') return pathname.startsWith('/teacher/settings');
  return pathname === href || pathname.startsWith(`${href}/`);
}
