'use client';

import { BarChart3, BookOpen, ClipboardCheck, Home, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const mobileTeacherItems = [
  { label: 'Beranda', href: '/teacher/dashboard', icon: Home },
  { label: 'Kelas', href: '/teacher/classes', icon: Users },
  { label: 'Modul', href: '/teacher/modules', icon: BookOpen },
  { label: 'Kuis', href: '/teacher/quizzes', icon: ClipboardCheck },
  { label: 'Laporan', href: '/teacher/reports', icon: BarChart3 },
];

export function TeacherMobileBottomNav() {
  const pathname = usePathname() ?? '';

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-primary/10 bg-white px-2 py-2 shadow-soft lg:hidden">
      {mobileTeacherItems.map((item) => {
        const Icon = item.icon;
        const active = isActivePath(pathname, item.href);

        return (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              'flex min-w-0 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[11px] font-bold transition',
              active ? 'bg-mint text-primary' : 'text-muted-foreground hover:bg-mint/50 hover:text-primary',
            )}
          >
            <Icon className="h-5 w-5" />
            <span className="max-w-full truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function isActivePath(pathname: string, href: string) {
  if (href === '/teacher/dashboard') return pathname === '/teacher' || pathname === '/teacher/dashboard';
  return pathname === href || pathname.startsWith(`${href}/`);
}
