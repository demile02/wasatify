'use client';

import type { FormEvent, ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import {
  BookOpen,
  ClipboardCheck,
  ClipboardList,
  FileText,
  GraduationCap,
  Home,
  ImageIcon,
  KeyRound,
  Mail,
  Megaphone,
  MessageSquareText,
  Search,
  Settings,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { TeacherMobileBottomNav } from '@/components/layout/teacher-mobile-bottom-nav';
import { AppLogo } from '@/components/shared/app-logo';
import { ProfileMenu } from '@/components/shared/profile-menu';
import { Button } from '@/components/ui/button';
import { TeacherMobileQuickActions } from '@/components/teacher/teacher-mobile-quick-actions';
import { teacherNavigation } from '@/lib/constants/navigation';
import type { Profile } from '@/lib/types';
import { cn } from '@/lib/utils';

type TeacherShellProps = {
  profile: Profile;
  notificationSlot: ReactNode;
  children: ReactNode;
  demoMode?: boolean;
};

const iconMap = {
  Home,
  ImageIcon,
  Users,
  BookOpen,
  ClipboardCheck,
  ClipboardList,
  GraduationCap,
  KeyRound,
  MessageSquareText,
  FileText,
  Megaphone,
  Mail,
  Settings,
};

export function TeacherShell({ profile, notificationSlot, children, demoMode = false }: TeacherShellProps) {
  const pathname = usePathname() ?? '';
  const router = useRouter();
  const desktopSearchRef = useRef<HTMLInputElement>(null);
  const mobileSearchRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const basePath = demoMode ? '/demo/teacher' : '/teacher';
  const headerLabel = getTeacherHeaderLabel(pathname, basePath, profile.full_name);
  const navigationItems = profile.role === 'admin'
    ? [
        ...teacherNavigation.slice(0, -1),
        { label: 'Kode Guru', href: '/teacher/invites', icon: 'KeyRound' },
        ...teacherNavigation.slice(-1),
      ]
    : teacherNavigation;

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const input = form.elements.namedItem('teacherSearch') as HTMLInputElement | null;
    const query = input?.value.trim() ?? '';
    input?.blur();
    setSearchQuery(query);

    const isModulePage = pathname.startsWith(`${basePath}/modules`);
    if (!query && !isModulePage) return;

    const destination = `${basePath}/modules${query ? `?q=${encodeURIComponent(query)}` : ''}`;
    if (isModulePage) router.replace(destination);
    else if (query) router.push(destination);
  }

  useEffect(() => {
    const isModulePage = pathname.startsWith(`${basePath}/modules`);
    setSearchQuery(isModulePage ? new URLSearchParams(window.location.search).get('q') ?? '' : '');
  }, [basePath, pathname]);

  return (
    <div className="app-ui min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col overflow-hidden bg-dark-emerald px-4 py-5 text-white shadow-soft lg:flex">
        <div className="absolute inset-x-0 bottom-0 h-72 bg-[radial-gradient(circle_at_50%_100%,rgba(201,138,26,0.25),transparent_64%)]" />
        <div className="relative px-2">
          <AppLogo href={demoMode ? '/demo' : '/'} size="sm" theme="dark" />
        </div>

        <nav className="relative mt-8 space-y-1.5">
          {navigationItems.map((item) => {
            const Icon = iconMap[item.icon as keyof typeof iconMap] ?? Home;
            const href = remapTeacherHref(item.href, basePath);
            const active = isActivePath(pathname, href, item.label, basePath);

            return (
              <Link
                key={item.label}
                href={href}
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
            <Link href={demoMode ? `${basePath}/modules` : '/teacher/modules/new'}>Tambah Modul</Link>
          </Button>
        </div>
      </aside>

      <div className="min-w-0 lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-primary/10 bg-background lg:bg-background/88 lg:backdrop-blur-xl">
          <div className="flex min-h-16 items-center gap-3 px-5 py-3 sm:px-8 md:min-h-20">
            <div className="shrink-0 lg:hidden">
              <AppLogo href={demoMode ? '/demo' : '/'} size="sm" />
            </div>

            <div className="hidden shrink-0 whitespace-nowrap lg:block">
              <p className="text-sm font-semibold text-primary">{headerLabel}</p>
              <p className="text-xs text-muted-foreground">{getTeacherHeaderContext(profile)}</p>
            </div>

            <form
              onSubmit={submitSearch}
              className="ml-auto hidden min-h-11 min-w-0 w-full flex-1 items-center gap-2 rounded-xl border border-border bg-white px-4 shadow-sm md:flex"
            >
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                ref={desktopSearchRef}
                name="teacherSearch"
                aria-label="Cari modul"
                placeholder="Cari modul..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="h-11 min-h-11 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
              />
            </form>

            {notificationSlot}

            <ProfileMenu
              profile={profile}
              roleLabel={profile.role === 'admin' ? 'Admin' : 'Guru'}
              profileHref={demoMode ? `${basePath}/settings` : '/teacher/settings'}
              exitHref={demoMode ? '/demo' : undefined}
            />
          </div>

          <div className="border-t border-primary/10 px-5 pb-3 pt-3 md:hidden">
            <p className="mb-2 text-sm font-semibold text-primary">{headerLabel}</p>
            <form onSubmit={submitSearch} className="flex min-h-11 items-center gap-2 rounded-xl border border-border bg-white px-4 shadow-sm">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                ref={mobileSearchRef}
                name="teacherSearch"
                aria-label="Cari modul"
                placeholder="Cari modul..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="h-11 min-h-11 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
              />
            </form>
          </div>
        </header>

        <main className="min-w-0 overflow-x-hidden px-5 pt-5 pb-teacher-app-bottom sm:px-8 sm:pt-8 lg:pb-10 xl:px-10 xl:pt-10">
          <div className="app-page-content mx-auto min-w-0 max-w-[1536px]">{children}</div>
        </main>
      </div>

      <TeacherMobileBottomNav profile={profile} demoMode={demoMode} />
      <TeacherMobileQuickActions isAdmin={profile.role === 'admin'} demoMode={demoMode} />
    </div>
  );
}

function remapTeacherHref(href: string, basePath: string) {
  if (href === '/teacher' || href === '/teacher/dashboard') return basePath;
  return href.startsWith('/teacher') ? `${basePath}${href.slice('/teacher'.length)}` : href;
}

function getTeacherHeaderLabel(pathname: string, basePath: string, fullName: string) {
  const route = pathname.slice(basePath.length) || '/';
  if (route === '/' || route === '/dashboard') return 'Dashboard Guru';
  if (route === '/modules') return 'Modul Pembelajaran';
  if (route === '/modules/new') return 'Buat Modul';
  if (/^\/modules\/[^/]+\/preview$/.test(route)) return 'Preview Modul';
  if (/^\/modules\/[^/]+\/edit$/.test(route)) return 'Edit Modul';
  if (route.startsWith('/modules/')) return 'Modul Pembelajaran';
  if (route === '/classes') return 'Kelas Saya';
  if (route.startsWith('/classes/')) return 'Detail Kelas';
  if (route === '/quizzes') return 'Kuis & Evaluasi';
  if (route === '/tasks') return 'Tugas Kelas';
  if (route === '/students') return 'Data Siswa';
  if (route === '/reflections') return 'Refleksi Siswa';
  if (route === '/reports') return 'Laporan Kelas';
  if (route.startsWith('/reports/')) return 'Ekspor Laporan';
  if (route === '/announcements') return 'Pengumuman';
  if (route === '/media') return 'Materi & Media';
  if (route === '/messages') return 'Pesan';
  if (route === '/settings') return 'Pengaturan';
  if (route === '/invites') return 'Kode Guru';
  return `Assalamu'alaikum, ${fullName}`;
}

function getTeacherHeaderContext(profile: Profile) {
  if (profile.role === 'admin') return 'Administrasi';

  const subject = profile.subject?.trim();
  if (subject) return `Mata Pelajaran: ${subject}`;
  return 'Mata pelajaran belum diisi';
}

function isActivePath(pathname: string, href: string, label: string, basePath: string) {
  if (label === 'Beranda') return pathname === basePath || pathname === `${basePath}/dashboard`;
  if (label === 'Modul') return pathname.startsWith(`${basePath}/modules`);
  if (label === 'Kelas Saya') return pathname.startsWith(`${basePath}/classes`);
  if (label === 'Kuis') return pathname.startsWith(`${basePath}/quizzes`);
  if (label === 'Siswa') return pathname.startsWith(`${basePath}/students`);
  if (label === 'Refleksi') return pathname.startsWith(`${basePath}/reflections`);
  if (label === 'Laporan') return pathname.startsWith(`${basePath}/reports`);
  if (label === 'Pengumuman') return pathname.startsWith(`${basePath}/announcements`);
  if (label === 'Media') return pathname.startsWith(`${basePath}/media`);
  if (label === 'Pesan') return pathname.startsWith(`${basePath}/messages`);
  if (label === 'Pengaturan') return pathname.startsWith(`${basePath}/settings`);
  return pathname === href || pathname.startsWith(`${href}/`);
}
