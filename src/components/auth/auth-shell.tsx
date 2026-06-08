import type { ReactNode } from 'react';
import { BookOpen, CheckCircle2, Monitor, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { AuthRedirectGuard } from '@/components/auth/auth-redirect-guard';
import { AppLogo } from '@/components/shared/app-logo';

type AuthShellProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export function AuthShell({ title, description, children }: AuthShellProps) {
  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,hsl(var(--cream))_0%,hsl(var(--background))_52%,hsl(var(--mint))_100%)]">
      <AuthRedirectGuard />
      <div className="grid min-h-screen lg:grid-cols-[0.95fr_1.05fr]">
        <section className="relative hidden overflow-hidden border-r border-primary/10 p-8 lg:flex lg:flex-col xl:p-12">
          <div className="absolute inset-0 islamic-pattern opacity-80" />
          <div className="relative z-10">
            <AppLogo href="/" size="lg" />
          </div>

          <div className="relative z-10 my-auto max-w-xl">
            <p className="mb-4 inline-flex rounded-full border border-primary/10 bg-white/80 px-4 py-2 text-sm font-semibold text-primary shadow-sm">
              Microlearning Islam Wasathiyah
            </p>
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
                  <p className="text-sm font-bold text-ink">{label as string}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 rounded-3xl border border-primary/10 bg-white/75 p-5 shadow-card">
            <div className="flex items-start gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary text-white">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <p className="text-sm leading-6 text-muted-foreground">
                Belajar dan mengajar dalam satu platform yang aman, terukur, dan selaras
                dengan nilai Islam Wasathiyah.
              </p>
            </div>
          </div>
        </section>

        <section className="flex min-h-screen flex-col px-5 py-6 sm:px-8 lg:px-12">
          <div className="mb-8 flex items-center justify-between gap-4 lg:hidden">
            <AppLogo href="/" size="sm" />
            <Link href="/" className="text-sm font-semibold text-primary">
              Beranda
            </Link>
          </div>

          <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center py-8">
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}
