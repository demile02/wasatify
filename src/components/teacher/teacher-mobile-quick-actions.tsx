'use client';

import { BookOpen, ClipboardCheck, ClipboardList, FileText, ImageIcon, KeyRound, Megaphone, Plus, Users } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

const quickActions = [
  { label: 'Tambah Modul', href: '/teacher/modules/new', icon: BookOpen },
  { label: 'Kelola Kelas', href: '/teacher/classes', icon: Users },
  { label: 'Buat Kuis', href: '/teacher/quizzes', icon: ClipboardCheck },
  { label: 'Buat Tugas', href: '/teacher/tasks', icon: ClipboardList },
  { label: 'Pengumuman', href: '/teacher/announcements', icon: Megaphone },
  { label: 'Upload Media', href: '/teacher/media', icon: ImageIcon },
  { label: 'Laporan', href: '/teacher/reports', icon: FileText },
];

export function TeacherMobileQuickActions({ isAdmin = false, demoMode = false }: { isAdmin?: boolean; demoMode?: boolean }) {
  const actions = isAdmin
    ? [...quickActions, { label: 'Kode Guru', href: '/teacher/invites', icon: KeyRound }]
    : quickActions;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          size="icon"
          className="safe-bottom-fab fixed right-5 z-[45] h-14 w-14 rounded-full shadow-soft lg:hidden"
          aria-label="Buka aksi cepat guru"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="safe-bottom-sheet rounded-t-3xl border-primary/10">
        <SheetHeader className="text-left">
          <SheetTitle>Aksi Cepat</SheetTitle>
          <SheetDescription>Akses pintas untuk pekerjaan guru yang paling sering dipakai.</SheetDescription>
        </SheetHeader>

        <div className="mt-5 grid gap-3">
          {actions.map((action) => {
            const Icon = action.icon;

            return (
              <SheetClose key={action.label} asChild>
                <Link
                  href={demoMode ? remapTeacherHref(action.href) : action.href}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-white p-4 text-sm font-bold text-ink transition hover:border-primary/30 hover:bg-mint/40"
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-mint text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  {action.label}
                </Link>
              </SheetClose>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function remapTeacherHref(href: string) {
  if (href === '/teacher' || href === '/teacher/dashboard') return '/demo/teacher';
  if (href === '/teacher/modules/new') return '/demo/teacher/modules';
  return href.startsWith('/teacher') ? `/demo/teacher${href.slice('/teacher'.length)}` : href;
}
