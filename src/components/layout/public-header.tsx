import Link from 'next/link';
import { PublicMobileMenu } from '@/components/layout/public-mobile-menu';
import { PublicContainer } from '@/components/layout/public-container';
import { AppLogo } from '@/components/shared/app-logo';
import { Button } from '@/components/ui/button';
import { publicNavigation } from '@/lib/constants/navigation';

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-primary/10 bg-background lg:bg-background/88 lg:backdrop-blur-xl">
      <PublicContainer className="flex min-h-20 flex-wrap items-center justify-between gap-x-2 gap-y-3 py-3 sm:gap-x-3 lg:flex-nowrap">
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
          <Button asChild size="sm" className="hidden px-3 min-[480px]:inline-flex min-[480px]:px-4">
            <Link href="/register">Daftar</Link>
          </Button>
        </div>

        <PublicMobileMenu />
      </PublicContainer>
    </header>
  );
}
