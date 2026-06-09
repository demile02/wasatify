'use client';

import {
  BarChart3,
  BookOpen,
  ClipboardCheck,
  Home,
  ImageIcon,
  Mail,
  Megaphone,
  MessageSquareText,
  Settings,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getQuickAccessNavItems } from '@/lib/quick-access';
import type { Profile } from '@/lib/types';
import { cn } from '@/lib/utils';

const iconMap = {
  Home,
  Users,
  BookOpen,
  ClipboardCheck,
  BarChart3,
  MessageSquareText,
  Megaphone,
  ImageIcon,
  Mail,
  Settings,
};

export function TeacherMobileBottomNav({ profile }: { profile: Profile }) {
  const pathname = usePathname() ?? '';
  const mobileTeacherItems = getQuickAccessNavItems(profile.quick_access, 'teacher');

  return (
    <nav
      className="safe-bottom-nav fixed inset-x-0 bottom-0 z-[70] grid border-t border-primary/10 bg-white px-2 pt-2 shadow-soft lg:hidden"
      style={{ gridTemplateColumns: `repeat(${mobileTeacherItems.length}, minmax(0, 1fr))` }}
    >
      {mobileTeacherItems.map((item) => {
        const Icon = iconMap[item.icon as keyof typeof iconMap] ?? Home;
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
            <span className="max-w-full truncate">{item.shortLabel}</span>
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
