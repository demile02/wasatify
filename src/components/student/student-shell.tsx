'use client';

import type { FormEvent, ReactNode } from 'react';
import { useRef } from 'react';
import {
  Award,
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
import { NotificationBell } from '@/components/shared/notification-bell';
import { ProfileMenu } from '@/components/shared/profile-menu';
import { Button } from '@/components/ui/button';
import { studentNavigation } from '@/lib/constants/navigation';
import type { NotificationItem } from '@/lib/notifications';
import type { Profile } from '@/lib/types';
import { cn } from '@/lib/utils';

type StudentShellProps = {
  profile: Profile;
  notifications?: NotificationItem[];
  children: ReactNode;
};

const iconMap = {
  Home,
  BookOpen,
  ClipboardCheck,
  ClipboardList,
  MessageSquareText,
  BarChart3,
  Award,
  Megaphone,
  Mail,
  Settings,
};

const mobileItems = studentNavigation.filter((item) =>
  ['Beranda', 'Modul Belajar', 'Kuis', 'Refleksi Diri', 'Progress'].includes(item.label),
);

export function StudentShell({ profile, notifications = [], children }: StudentShellProps) {
  const pathname = usePathname() ?? '';
  const router = useRouter();
  const desktopSearchRef = useRef<HTMLInputElement>(null);
  const mobileSearchRef = useRef<HTMLInputElement>(null);
  const showTopbarSearch = !pathname.startsWith('/student/modules');

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const input = form.elements.namedItem('studentSearch') as HTMLInputElement | null;
    const query = input?.value.trim() ?? '';
    input?.blur();

    if (!query) return;
    router.push(`/student/modules?q=${encodeURIComponent(query)}`);
  }

  return (
    <div className="app-ui min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-primary/10 bg-white px-4 py-5 shadow-soft lg:flex">
        <div className="px-2">
          <AppLogo href="/" size="sm" />
        </div>

        <nav className="mt-8 space-y-1.5">
          {studentNavigation.map((item) => {
            const Icon = iconMap[item.icon as keyof typeof iconMap] ?? Home;
            const active = isActivePath(pathname, item.href, item.label);
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition',
                  active ? 'bg-primary text-white shadow-card' : 'text-muted-foreground hover:bg-mint hover:text-primary',
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto rounded-2xl border border-primary/10 bg-mint/55 p-4">
          <p className="text-sm font-bold text-ink">Butuh bantuan?</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">Hubungi tim kami jika kamu mengalami kendala.</p>
          <Button variant="outline" size="sm" className="mt-3 w-full bg-white">
            Hubungi Kami
          </Button>
        </div>
      </aside>

      <div className="min-w-0 lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-primary/10 bg-background/86 backdrop-blur-xl">
          <div className="flex min-h-16 items-center gap-3 px-5 py-3 sm:px-8 md:min-h-20">
            <div className="shrink-0 lg:hidden">
              <AppLogo href="/" size="sm" variant="horizontal" />
            </div>

            <div className="hidden min-w-0 lg:block">
              <p className="text-sm font-semibold text-primary">{"Assalamu'alaikum, "}{profile.full_name}</p>
              <p className="text-xs text-muted-foreground">{profile.class_name ?? 'Siswa WASATIFY'}</p>
            </div>

            {showTopbarSearch && (
            <form
              onSubmit={submitSearch}
              className="ml-auto hidden w-full max-w-md items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 shadow-sm md:flex"
            >
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                ref={desktopSearchRef}
                name="studentSearch"
                aria-label="Cari modul"
                placeholder="Cari modul, kuis, atau materi..."
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
              />
            </form>
            )}

            <NotificationBell items={notifications} />

            <ProfileMenu profile={profile} roleLabel="Siswa" profileHref="/student/settings" />
          </div>

          {showTopbarSearch && (
          <div className="border-t border-primary/10 px-5 pb-3 md:hidden">
            <form onSubmit={submitSearch} className="flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 shadow-sm">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                ref={mobileSearchRef}
                name="studentSearch"
                aria-label="Cari modul mobile"
                placeholder="Cari modul..."
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
              />
            </form>
          </div>
          )}
        </header>

        <main className="min-w-0 overflow-x-hidden px-5 py-6 pb-app-bottom sm:px-8 lg:pb-10">
          <div className="mx-auto min-w-0 max-w-7xl">{children}</div>
        </main>
      </div>

      <nav className="safe-bottom-nav fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-primary/10 bg-white px-2 pt-2 shadow-soft lg:hidden">
        {mobileItems.map((item) => {
          const Icon = iconMap[item.icon as keyof typeof iconMap] ?? Home;
          const active = isActivePath(pathname, item.href, item.label);
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
              <span className="max-w-full truncate">{item.label.split(' ')[0]}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function isActivePath(pathname: string, href: string, label: string) {
  if (label === 'Kuis') return pathname.startsWith('/student/quizzes') || pathname.includes('/quiz');
  if (label === 'Beranda') return pathname === '/student/dashboard' || pathname === '/student';
  if (href === '/student/modules') return pathname.startsWith('/student/modules') && !pathname.includes('/quiz');
  if (href === '/student/progress') return pathname.startsWith('/student/progress');
  if (href === '/student/reflection') return pathname.startsWith('/student/reflection');
  if (href === '/student/settings') return pathname.startsWith('/student/settings') || pathname.startsWith('/student/profile');
  return pathname === href || pathname.startsWith(`${href}/`);
}
