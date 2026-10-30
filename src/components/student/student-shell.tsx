'use client';

import type { FormEvent, ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import {
  BarChart3,
  BookOpen,
  ClipboardCheck,
  ClipboardList,
  Home,
  Mail,
  Megaphone,
  MessageSquareText,
  Search,
  Settings,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AppLogo } from '@/components/shared/app-logo';
import { ProfileMenu } from '@/components/shared/profile-menu';
import { studentNavigation } from '@/lib/constants/navigation';
import { getQuickAccessNavItems } from '@/lib/quick-access';
import type { Profile } from '@/lib/types';
import { cn } from '@/lib/utils';

type StudentShellProps = {
  profile: Profile;
  notificationSlot: ReactNode;
  messageBadge: ReactNode;
  children: ReactNode;
  demoMode?: boolean;
};

const iconMap = {
  Home,
  BookOpen,
  ClipboardCheck,
  ClipboardList,
  MessageSquareText,
  BarChart3,
  Megaphone,
  Mail,
  Settings,
};

export function StudentShell({ profile, notificationSlot, messageBadge, children, demoMode = false }: StudentShellProps) {
  const pathname = usePathname() ?? '';
  const router = useRouter();
  const desktopSearchRef = useRef<HTMLInputElement>(null);
  const mobileSearchRef = useRef<HTMLInputElement>(null);
  const basePath = demoMode ? '/demo/students' : '/student';
  const headerLabel = getStudentHeaderLabel(pathname, basePath, profile.full_name);
  const [searchQuery, setSearchQuery] = useState('');
  const mobileItems = getQuickAccessNavItems(profile.quick_access, 'student')
    .map((item) => ({ ...item, href: remapStudentHref(item.href, basePath) }));
  const navigationItems = studentNavigation;

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const input = form.elements.namedItem('studentSearch') as HTMLInputElement | null;
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
            const href = remapStudentHref(item.href, basePath);
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
                <span className="min-w-0 flex-1">{item.label}</span>
                {item.label === 'Pesan' && messageBadge}
              </Link>
            );
          })}
        </nav>

      </aside>

      <div className="min-w-0 lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-primary/10 bg-background lg:bg-background/86 lg:backdrop-blur-xl">
          <div className="flex min-h-16 items-center gap-3 px-5 py-3 sm:px-8 md:min-h-20">
            <div className="shrink-0 lg:hidden">
              <AppLogo href={demoMode ? '/demo' : '/'} size="sm" />
            </div>

            <div className="hidden shrink-0 whitespace-nowrap lg:block">
              <p className="text-sm font-semibold text-primary">{headerLabel}</p>
              <p className="text-xs text-muted-foreground">{profile.class_name ?? 'Siswa WASATIFY'}</p>
            </div>

            <form
              onSubmit={submitSearch}
              className="ml-auto hidden min-h-11 min-w-0 w-full flex-1 items-center gap-2 rounded-xl border border-border bg-white px-4 shadow-sm md:flex"
            >
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                ref={desktopSearchRef}
                name="studentSearch"
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
              roleLabel="Siswa"
              profileHref={demoMode ? `${basePath}/settings` : '/student/settings'}
              exitHref={demoMode ? '/demo' : undefined}
            />
          </div>

          <div className="border-t border-primary/10 px-5 pb-3 pt-3 md:hidden">
            <p className="mb-2 text-sm font-semibold text-primary">{headerLabel}</p>
            <form onSubmit={submitSearch} className="flex min-h-11 items-center gap-2 rounded-xl border border-border bg-white px-4 shadow-sm">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                ref={mobileSearchRef}
                name="studentSearch"
                aria-label="Cari modul mobile"
                placeholder="Cari modul..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="h-11 min-h-11 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
              />
            </form>
          </div>
        </header>

        <main className="min-w-0 overflow-x-hidden px-5 pt-5 pb-app-bottom sm:px-8 sm:pt-8 lg:pb-10 xl:px-10 xl:pt-10">
          <div className="app-page-content mx-auto min-w-0 max-w-[1536px]">{children}</div>
        </main>
      </div>

      <nav
        className="safe-bottom-nav fixed inset-x-0 bottom-0 z-40 grid border-t border-primary/10 bg-white px-2 pt-2 shadow-soft lg:hidden"
        style={{ gridTemplateColumns: `repeat(${mobileItems.length}, minmax(0, 1fr))` }}
      >
        {mobileItems.map((item) => {
          const Icon = iconMap[item.icon as keyof typeof iconMap] ?? Home;
          const active = isActivePath(pathname, item.href, item.label, basePath);
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                'flex min-w-0 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[11px] font-bold transition',
                active ? 'bg-mint text-primary' : 'text-muted-foreground',
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="max-w-full truncate">{item.shortLabel}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function remapStudentHref(href: string, basePath: string) {
  if (href === '/student' || href === '/student/dashboard') return basePath;
  return href.startsWith('/student') ? `${basePath}${href.slice('/student'.length)}` : href;
}

function getStudentHeaderLabel(pathname: string, basePath: string, fullName: string) {
  const route = pathname.slice(basePath.length) || '/';
  if (route === '/' || route === '/dashboard') return 'Dashboard Siswa';
  if (route.endsWith('/quiz/result')) return 'Hasil Kuis';
  if (route.includes('/quiz')) return 'Kuis Pemahaman';
  if (route === '/modules') return 'Modul Belajar';
  if (route.startsWith('/modules/')) return 'Materi Modul';
  if (route === '/quizzes') return 'Kuis';
  if (route === '/progress') return 'Progress Belajar';
  if (route === '/reflection') return 'Refleksi Diri';
  if (route === '/tasks') return 'Tugas Pembelajaran';
  if (route === '/announcements') return 'Pengumuman';
  if (route === '/messages') return 'Pesan';
  if (route === '/settings') return 'Pengaturan';
  if (route === '/profile') return 'Profil';
  if (route === '/certificates') return 'Sertifikat';
  return `Assalamu'alaikum, ${fullName}`;
}

function isActivePath(pathname: string, href: string, label: string, basePath: string) {
  if (label === 'Kuis') return pathname.startsWith(`${basePath}/quizzes`) || pathname.includes('/quiz');
  if (label === 'Beranda') return pathname === basePath || pathname === `${basePath}/dashboard`;
  if (href === `${basePath}/modules`) return pathname.startsWith(`${basePath}/modules`) && !pathname.includes('/quiz');
  if (href === `${basePath}/progress`) return pathname.startsWith(`${basePath}/progress`);
  if (href === `${basePath}/reflection`) return pathname.startsWith(`${basePath}/reflection`);
  if (href === `${basePath}/settings`) return pathname.startsWith(`${basePath}/settings`) || pathname.startsWith(`${basePath}/profile`);
  return pathname === href || pathname.startsWith(`${href}/`);
}
