'use client';

import type { FormEvent, ReactNode } from 'react';
import { useRef } from 'react';
import {
  BookOpen,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Home,
  ImageIcon,
  Mail,
  Megaphone,
  MessageSquareText,
  Search,
  Settings,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TeacherMobileBottomNav } from '@/components/layout/teacher-mobile-bottom-nav';
import { AppLogo } from '@/components/shared/app-logo';
import { NotificationBell } from '@/components/shared/notification-bell';
import { ProfileMenu } from '@/components/shared/profile-menu';
import { Button } from '@/components/ui/button';
import { TeacherMobileQuickActions } from '@/components/teacher/teacher-mobile-quick-actions';
import { teacherNavigation } from '@/lib/constants/navigation';
import type { NotificationItem } from '@/lib/notifications';
import type { Profile } from '@/lib/types';
import { cn } from '@/lib/utils';

type TeacherShellProps = {
  profile: Profile;
  notifications?: NotificationItem[];
  children: ReactNode;
};

const iconMap = {
  Home,
  ImageIcon,
  Users,
  BookOpen,
  ClipboardCheck,
  GraduationCap,
  MessageSquareText,
  FileText,
  Megaphone,
  Mail,
  Settings,
};

export function TeacherShell({ profile, notifications = [], children }: TeacherShellProps) {
  const pathname = usePathname() ?? '';
  const desktopSearchRef = useRef<HTMLInputElement>(null);
  const mobileSearchRef = useRef<HTMLInputElement>(null);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const input = form.elements.namedItem('teacherSearch') as HTMLInputElement | null;
    input?.blur();
  }

  return (
    <div className="app-ui min-h-screen bg-background">
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

      <div className="min-w-0 lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-primary/10 bg-background/88 backdrop-blur-xl">
          <div className="flex min-h-16 items-center gap-3 px-5 py-3 sm:px-8 md:min-h-20">
            <div className="shrink-0 lg:hidden">
              <AppLogo href="/" size="sm" variant="horizontal" />
            </div>

            <div className="hidden min-w-0 lg:block">
              <p className="text-sm font-semibold text-primary">{"Assalamu'alaikum, "}{profile.full_name}</p>
              <p className="text-xs text-muted-foreground">
                {profile.subject ?? profile.school_name ?? 'Guru WASATIFY'}
              </p>
            </div>

            <form
              onSubmit={submitSearch}
              className="ml-auto hidden w-full max-w-lg items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 shadow-sm md:flex"
            >
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                ref={desktopSearchRef}
                name="teacherSearch"
                aria-label="Cari data guru"
                placeholder="Cari kelas, modul, siswa, atau laporan..."
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
              />
            </form>

            <NotificationBell items={notifications} />

            <ProfileMenu profile={profile} roleLabel="Guru" profileHref="/teacher/settings" />
          </div>

          <div className="border-t border-primary/10 px-5 pb-3 md:hidden">
            <form onSubmit={submitSearch} className="flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 shadow-sm">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                ref={mobileSearchRef}
                name="teacherSearch"
                aria-label="Cari data guru mobile"
                placeholder="Cari kelas atau modul..."
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
              />
            </form>
          </div>
        </header>

        <main className="min-w-0 overflow-x-hidden px-5 py-6 pb-teacher-app-bottom sm:px-8 lg:pb-10 xl:px-10">
          <div className="mx-auto min-w-0 max-w-[1536px]">{children}</div>
        </main>
      </div>

      <TeacherMobileBottomNav profile={profile} />
      <TeacherMobileQuickActions />
    </div>
  );
}

function isActivePath(pathname: string, href: string, label: string) {
  if (label === 'Beranda') return pathname === '/teacher' || pathname === '/teacher/dashboard';
  if (label === 'Modul') return pathname.startsWith('/teacher/modules');
  if (label === 'Kelas Saya') return pathname.startsWith('/teacher/classes');
  if (label === 'Kuis') return pathname.startsWith('/teacher/quizzes');
  if (label === 'Siswa') return pathname.startsWith('/teacher/students');
  if (label === 'Refleksi') return pathname.startsWith('/teacher/reflections');
  if (label === 'Laporan') return pathname.startsWith('/teacher/reports');
  if (label === 'Pengumuman') return pathname.startsWith('/teacher/announcements');
  if (label === 'Media') return pathname.startsWith('/teacher/media');
  if (label === 'Pesan') return pathname.startsWith('/teacher/messages');
  if (label === 'Pengaturan') return pathname.startsWith('/teacher/settings');
  return pathname === href || pathname.startsWith(`${href}/`);
}
