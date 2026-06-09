import Link from 'next/link';
import { PublicContainer } from '@/components/layout/public-container';
import { AppLogo } from '@/components/shared/app-logo';
import { Button } from '@/components/ui/button';
import { publicNavigation } from '@/lib/constants/navigation';

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-primary/10 bg-background/88 backdrop-blur-xl">
      <PublicContainer className="flex min-h-20 flex-wrap items-center justify-between gap-3 py-3 lg:flex-nowrap">
        <AppLogo href="/" size="sm" />

        <nav className="hidden items-center gap-8 text-sm font-semibold text-foreground/80 lg:flex">
          {publicNavigation.map((item) => (
            <Link key={item.label} href={item.href} className="transition hover:text-primary">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Button asChild variant="outline" size="sm" className="px-3 sm:px-4">
            <Link href="/login">Masuk</Link>
          </Button>
          <Button asChild size="sm" className="px-3 sm:px-4">
            <Link href="/register">Daftar</Link>
          </Button>
        </div>

        <nav className="flex w-full gap-5 overflow-x-auto border-t border-primary/10 pt-3 text-sm font-semibold text-foreground/75 scrollbar-hide lg:hidden">
          {publicNavigation.map((item) => (
            <Link key={item.label} href={item.href} className="shrink-0 transition hover:text-primary">
              {item.label}
            </Link>
          ))}
        </nav>
      </PublicContainer>
    </header>
  );
}
