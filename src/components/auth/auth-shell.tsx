import type { ReactNode } from 'react';
import { BookOpen, CheckCircle2, Monitor } from 'lucide-react';
import Link from 'next/link';
import { AuthRedirectGuard } from '@/components/auth/auth-redirect-guard';
import { PublicContainer } from '@/components/layout/public-container';
import { AppLogo } from '@/components/shared/app-logo';

type AuthShellProps = {
  title: string;
  description: string;
  children: ReactNode;
  desktopAction?: ReactNode;
  redirectGuard?: boolean;
};

export function AuthShell({ title, description, children, desktopAction, redirectGuard = true }: AuthShellProps) {
  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,hsl(var(--cream))_0%,hsl(var(--background))_52%,hsl(var(--mint))_100%)]">
      {redirectGuard && <AuthRedirectGuard />}
      <PublicContainer className="grid min-h-screen px-0 sm:px-0 lg:grid-cols-[0.95fr_1.05fr] lg:px-0 xl:px-0">
        <section className="relative hidden overflow-hidden border-r border-primary/10 p-8 lg:flex lg:flex-col xl:p-12">
          <div className="absolute inset-0 islamic-pattern opacity-80" />
          <div className="relative z-10">
            <AppLogo href="/" size="lg" />
          </div>

          <div className="relative z-10 mt-12 mb-10 max-w-xl">
            <h1 className="text-4xl font-extrabold leading-tight text-ink xl:text-5xl">{title}</h1>
            <p className="mt-5 text-base leading-8 text-muted-foreground">{description}</p>

            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              {[
                ['Materi Ringkas', BookOpen],
                ['Kuis Interaktif', CheckCircle2],
                ['Progress Real-time', Monitor],
              ].map(([label, Icon]) => (
                <div key={label as string} className="rounded-2xl border border-primary/10 bg-white/78 p-4 shadow-card">
                  <Icon className="mb-3 h-6 w-6 text-primary" />
                  <p className="text-sm font-bold text-ink">
                    {label === 'Progress Real-time' ? (
                      <>
                        <span className="block">Progress</span>
                        <span className="block">Real-time</span>
                      </>
                    ) : label as string}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </section>

        <section className="relative flex min-h-screen flex-col px-5 py-4 sm:px-8 sm:py-5 lg:px-12 lg:py-5">
          {desktopAction && <div className="absolute right-12 top-5 z-10 hidden lg:block">{desktopAction}</div>}
          <div className="mb-4 flex items-center justify-between gap-4 sm:mb-5 lg:hidden">
            <AppLogo href="/" size="sm" />
            <Link href="/" className="text-sm font-semibold text-primary">
              Beranda
            </Link>
          </div>

          <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-start py-3 lg:justify-center lg:py-4">
            {children}
          </div>
        </section>
      </PublicContainer>
    </main>
  );
}
