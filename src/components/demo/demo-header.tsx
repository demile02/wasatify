import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { PublicContainer } from '@/components/layout/public-container';
import { AppLogo } from '@/components/shared/app-logo';
import { Button } from '@/components/ui/button';

type DemoHeaderProps = {
  showDemoLink?: boolean;
};

export function DemoHeader({ showDemoLink = false }: DemoHeaderProps) {
  return (
    <header className="border-b border-primary/10 bg-white">
      <PublicContainer className="flex items-center justify-between gap-3 py-3 sm:py-4">
        <AppLogo href="/" size="sm" />
        {showDemoLink ? (
          <Button asChild variant="outline" size="default" className="shrink-0 border-primary/65 px-3">
            <Link href="/demo" aria-label="Kembali ke semua demo">
              <ArrowLeft aria-hidden="true" className="h-4 w-4" />
              Demo
            </Link>
          </Button>
        ) : (
          <Button asChild variant="ghost" size="default" className="shrink-0 px-2">
            <Link href="/">Beranda</Link>
          </Button>
        )}
      </PublicContainer>
    </header>
  );
}
