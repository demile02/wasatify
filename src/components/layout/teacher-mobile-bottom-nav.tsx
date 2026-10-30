'use client';

import {
  BarChart3,
  BookOpen,
  ClipboardCheck,
  ClipboardList,
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
  ClipboardList,
  BarChart3,
  MessageSquareText,
  Megaphone,
  ImageIcon,
  Mail,
  Settings,
};

export function TeacherMobileBottomNav({ profile, demoMode = false }: { profile: Profile; demoMode?: boolean }) {
  const pathname = usePathname() ?? '';
  const basePath = demoMode ? '/demo/teacher' : '/teacher';
  const mobileTeacherItems = getQuickAccessNavItems(profile.quick_access, 'teacher')
    .map((item) => ({ ...item, href: remapTeacherHref(item.href, basePath) }));

  return (
    <nav
      className="safe-bottom-nav fixed inset-x-0 bottom-0 z-40 grid border-t border-primary/10 bg-white px-2 pt-2 shadow-soft lg:hidden"
      style={{ gridTemplateColumns: `repeat(${mobileTeacherItems.length}, minmax(0, 1fr))` }}
    >
      {mobileTeacherItems.map((item) => {
        const Icon = iconMap[item.icon as keyof typeof iconMap] ?? Home;
        const active = isActivePath(pathname, item.href, basePath);

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

function remapTeacherHref(href: string, basePath: string) {
  if (href === '/teacher' || href === '/teacher/dashboard') return basePath;
  return href.startsWith('/teacher') ? `${basePath}${href.slice('/teacher'.length)}` : href;
}

function isActivePath(pathname: string, href: string, basePath: string) {
  if (href === `${basePath}/dashboard`) return pathname === basePath || pathname === `${basePath}/dashboard`;
  return pathname === href || pathname.startsWith(`${href}/`);
}
