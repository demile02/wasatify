'use client';

import { useEffect, useMemo, useState } from 'react';
import { Download, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

type InstallAppPromptProps = {
  compact?: boolean;
  className?: string;
};

const dismissedKey = 'wasatify:pwa-install-dismissed';

export function InstallAppPrompt({ compact = false, className }: InstallAppPromptProps) {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const isIosSafari = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const userAgent = window.navigator.userAgent.toLowerCase();
    return /iphone|ipad|ipod/.test(userAgent) && /safari/.test(userAgent) && !/crios|fxios|edgios/.test(userAgent);
  }, []);

  useEffect(() => {
    const displayMode = window.matchMedia('(display-mode: standalone)');
    const standalone = displayMode.matches || window.navigator.standalone === true;
    setIsInstalled(standalone);
    setIsDismissed(window.localStorage.getItem(dismissedKey) === '1');

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
      setIsDismissed(false);
    }

    function handleInstalled() {
      setIsInstalled(true);
      setInstallEvent(null);
      window.localStorage.setItem(dismissedKey, '1');
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  async function installApp() {
    if (!installEvent) return;

    await installEvent.prompt();
    const choice = await installEvent.userChoice;

    if (choice.outcome === 'accepted') {
      window.localStorage.setItem(dismissedKey, '1');
    }

    setInstallEvent(null);
  }

  function dismissPrompt() {
    window.localStorage.setItem(dismissedKey, '1');
    setIsDismissed(true);
  }

  if (isInstalled || isDismissed) return null;
  if (!installEvent && !isIosSafari) return null;

  if (compact) {
    return (
      <div className={cn('rounded-2xl border border-primary/10 bg-white p-4 shadow-card', className)}>
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-mint text-primary">
            <Smartphone className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-extrabold text-ink">Install WASATIFY</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {isIosSafari
                ? 'Buka menu Share lalu pilih Add to Home Screen.'
                : 'Pasang aplikasi agar lebih cepat dibuka dari layar utama.'}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {installEvent && (
                <Button type="button" size="sm" onClick={installApp}>
                  <Download className="h-4 w-4" />
                  Install Aplikasi
                </Button>
              )}
              <Button type="button" size="sm" variant="ghost" onClick={dismissPrompt}>
                Nanti saja
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('rounded-3xl border border-primary/10 bg-white p-5 shadow-card', className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-mint text-primary">
            <Smartphone className="h-6 w-6" />
          </span>
          <div>
            <p className="font-extrabold text-ink">Install WASATIFY di perangkatmu</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {isIosSafari
                ? 'Di Safari iPhone/iPad, buka menu Share lalu pilih Add to Home Screen.'
                : 'Gunakan WASATIFY seperti aplikasi mobile dengan tampilan standalone.'}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {installEvent && (
            <Button type="button" onClick={installApp}>
              <Download className="h-4 w-4" />
              Install Aplikasi
            </Button>
          )}
          <Button type="button" variant="outline" onClick={dismissPrompt}>
            Nanti saja
          </Button>
        </div>
      </div>
    </div>
  );
}

declare global {
  interface Navigator {
    standalone?: boolean;
  }
}
