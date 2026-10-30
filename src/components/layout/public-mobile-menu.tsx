'use client';

import Link from 'next/link';
import { Menu } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { publicNavigation } from '@/lib/constants/navigation';

export function PublicMobileMenu() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button type="button" variant="outline" size="icon" aria-label="Buka menu navigasi" className="sm:h-9 sm:w-auto sm:gap-2 sm:px-3 lg:hidden">
          <Menu aria-hidden="true" className="h-4 w-4" />
          <span className="hidden sm:inline">Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[min(20rem,85vw)]">
        <SheetHeader className="pr-8 text-left">
          <SheetTitle>Navigasi WASATIFY</SheetTitle>
          <SheetDescription>Pilih bagian yang ingin dibuka.</SheetDescription>
        </SheetHeader>
        <nav aria-label="Navigasi utama" className="mt-8 grid gap-2">
          {publicNavigation.map((item) => (
            <SheetClose asChild key={item.label}>
              <Link
                href={item.href}
                className="rounded-xl px-4 py-3 text-base font-semibold text-foreground transition-colors hover:bg-mint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {item.label}
              </Link>
            </SheetClose>
          ))}
        </nav>
        <div className="mt-6 grid grid-cols-2 gap-3 border-t border-border pt-5">
          <SheetClose asChild>
            <Link href="/login" className={buttonVariants({ variant: 'outline', size: 'sm', className: 'w-full' })}>
              Masuk
            </Link>
          </SheetClose>
          <SheetClose asChild>
            <Link href="/register" className={buttonVariants({ size: 'sm', className: 'w-full' })}>
              Daftar
            </Link>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
}
