'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { PenLine, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { EmptyState } from '@/components/shared/empty-state';
import { ProgressBar } from '@/components/shared/progress-bar';
import { SectionCard } from '@/components/shared/section-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { submitReflectionAction } from '@/lib/student/actions';
import type { ReflectionDraft, ReflectionModuleOption } from '@/lib/student/reflection';
import { cn } from '@/lib/utils';

type ReflectionFormProps = {
  modules: ReflectionModuleOption[];
  selectedModuleId?: string;
  existingReflection?: ReflectionDraft | null;
  showCancel?: boolean;
};

const maxLength = 500;
const minReflectionLength = 30;
const minActionLength = 20;

export function ReflectionForm({ modules, selectedModuleId, existingReflection, showCancel = false }: ReflectionFormProps) {
  const router = useRouter();
  const firstAvailableModule = selectedModuleId ?? modules[0]?.id ?? '';
  const [moduleId, setModuleId] = useState(firstAvailableModule);
  const [reflectionText, setReflectionText] = useState(existingReflection?.reflectionText ?? '');
  const [actionPlan, setActionPlan] = useState(existingReflection?.actionPlan ?? '');
  const [error, setError] = useState<string | null>(null);
  const [hasSaved, setHasSaved] = useState(Boolean(existingReflection));
  const [savedReflectionText, setSavedReflectionText] = useState(existingReflection?.reflectionText ?? '');
  const [savedActionPlan, setSavedActionPlan] = useState(existingReflection?.actionPlan ?? '');
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [isPending, startTransition] = useTransition();

  const selectedModule = useMemo(
    () => modules.find((moduleItem) => moduleItem.id === moduleId),
    [moduleId, modules],
  );
  const isOverLimit = reflectionText.length > maxLength || actionPlan.length > maxLength;
  const reflectionTooShort = reflectionText.trim().length < minReflectionLength;
  const actionTooShort = actionPlan.trim().length < minActionLength;
  const canSubmit = Boolean(moduleId && !reflectionTooShort && !actionTooShort && !isOverLimit && !isPending);
  const hasUnsavedChanges = reflectionText !== savedReflectionText || actionPlan !== savedActionPlan;

  useEffect(() => {
    setModuleId(selectedModuleId ?? modules[0]?.id ?? '');
  }, [modules, selectedModuleId]);

  useEffect(() => {
    if (!hasUnsavedChanges) return;

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = '';
    }

    function handlePopState() {
      window.history.pushState({ wasatifyReflectionGuard: true }, '', window.location.href);
      setPendingHref('/student/reflection');
      setShowUnsavedDialog(true);
    }

    function handleDocumentClick(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      const link = target?.closest('a[href]') as HTMLAnchorElement | null;
      if (!link || link.target || link.download) return;
      if (link.href.startsWith('mailto:') || link.href.startsWith('tel:')) return;

      const nextUrl = new URL(link.href);
      if (nextUrl.origin !== window.location.origin) return;

      const currentHref = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      const nextHref = `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`;
      if (nextHref === currentHref) return;

      event.preventDefault();
      event.stopPropagation();
      setPendingHref(nextHref);
      setShowUnsavedDialog(true);
    }

    window.history.pushState({ wasatifyReflectionGuard: true }, '', window.location.href);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);
    document.addEventListener('click', handleDocumentClick, true);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('click', handleDocumentClick, true);
    };
  }, [hasUnsavedChanges]);

  if (!modules.length) {
    return (
      <EmptyState
        title="Belum ada modul untuk direfleksikan"
        description="Refleksi dapat dibuat setelah modul published tersedia untuk akunmu."
      />
    );
  }

  async function saveReflection() {
    setError(null);

    if (!canSubmit) {
      const message =
        reflectionTooShort
          ? 'Refleksi minimal 30 karakter.'
          : actionTooShort
            ? 'Aksi nyata minimal 20 karakter.'
            : isOverLimit
              ? 'Refleksi dan aksi nyata maksimal 500 karakter.'
              : 'Pilih modul terlebih dahulu.';
      setError(message);
      toast.warning(message);
      return false;
    }

    return new Promise<boolean>((resolve) => {
      startTransition(async () => {
        const result = await submitReflectionAction({
          moduleId,
          reflectionText,
          actionPlan,
        });

        if (!result.ok) {
          const message = result.error ?? 'Refleksi belum berhasil disimpan.';
          setError(message);
          toast.error(message);
          resolve(false);
          return;
        }

        setHasSaved(true);
        setSavedReflectionText(reflectionText);
        setSavedActionPlan(actionPlan);
        toast.success('Refleksi berhasil disimpan.');
        resolve(true);
      });
    });
  }

  function submitReflection() {
    void saveReflection();
  }

  function requestNavigation(nextHref: string) {
    if (!hasUnsavedChanges) {
      router.push(nextHref);
      return;
    }

    setPendingHref(nextHref);
    setShowUnsavedDialog(true);
  }

  function continueNavigation() {
    if (!pendingHref) return;
    setShowUnsavedDialog(false);
    router.push(pendingHref);
  }

  async function saveThenContinue() {
    const saved = await saveReflection();
    if (saved) continueNavigation();
  }

  return (
    <div className="space-y-6">
      <SectionCard>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <label htmlFor="reflection-module" className="text-sm font-bold text-ink">
            Pilih modul
          </label>
          {selectedModuleId && (
            <Button asChild type="button" variant="ghost" size="sm" className="w-fit px-0 text-primary hover:bg-transparent">
              <Link href="/student/reflection">Ganti Modul</Link>
            </Button>
          )}
        </div>
        <Select
          value={moduleId}
          onValueChange={(nextModuleId) => {
            if (nextModuleId === moduleId) return;
            requestNavigation(`/student/reflection?moduleId=${nextModuleId}`);
          }}
        >
          <SelectTrigger id="reflection-module" className="mt-2 h-12 rounded-xl bg-white font-semibold">
            <SelectValue placeholder="Pilih modul untuk refleksi" />
          </SelectTrigger>
          <SelectContent>
            {modules.map((moduleItem) => (
              <SelectItem key={moduleItem.id} value={moduleItem.id}>
                {moduleItem.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedModule && (
          <div className="mt-3 rounded-2xl border border-border bg-mint/35 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="font-bold text-ink">{selectedModule.title}</p>
                <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">
                  {selectedModule.description}
                </p>
              </div>
              <StatusBadge status={selectedModule.status} className="shrink-0" />
            </div>
            <ProgressBar value={selectedModule.progress} label="Progress modul" showValue className="mt-4" />
          </div>
        )}
      </SectionCard>

      <ReflectionField
        icon={PenLine}
        title="Refleksi Diri"
        description="Apa pelajaran paling berkesan yang kamu dapatkan dari modul ini?"
        placeholder="Tuliskan refleksi kamu di sini..."
        value={reflectionText}
        onChange={setReflectionText}
        minLength={minReflectionLength}
      />

      <ReflectionField
        icon={ShieldCheck}
        title="Aksi Nyata"
        description="Apa tindakan kecil yang akan kamu lakukan setelah belajar hari ini?"
        placeholder="Tuliskan aksi nyata yang akan kamu lakukan..."
        value={actionPlan}
        onChange={setActionPlan}
        minLength={minActionLength}
      />

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        {showCancel && (
          <Button type="button" variant="outline" className="sm:w-auto" onClick={() => requestNavigation('/student/reflection')}>
            Batalkan
          </Button>
        )}
        <Button type="button" className="w-full" disabled={isPending || !moduleId} onClick={submitReflection}>
          {isPending ? 'Menyimpan...' : hasSaved ? 'Simpan Perubahan' : 'Simpan Refleksi'}
        </Button>
      </div>

      <Dialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Perubahan belum disimpan</DialogTitle>
            <DialogDescription>
              Kamu sudah menulis refleksi, tetapi belum menyimpan perubahan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button type="button" variant="destructive" onClick={continueNavigation}>
              Buang Perubahan
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowUnsavedDialog(false)}>
              Lanjut Menulis
            </Button>
            <Button type="button" disabled={isPending} onClick={() => void saveThenContinue()}>
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

function ReflectionField({
  icon: Icon,
  title,
  description,
  placeholder,
  value,
  onChange,
  minLength,
}: {
  icon: typeof PenLine;
  title: string;
  description: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  minLength: number;
}) {
  const isOverLimit = value.length > maxLength;
  const isTooShort = value.trim().length < minLength;

  return (
    <SectionCard>
      <div className="mb-3 flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-mint text-primary">
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="font-bold text-ink">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <Textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-h-36 resize-none rounded-2xl bg-white text-sm leading-6 focus-visible:ring-primary/15"
      />
      <div className="mt-2 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <p className={cn('text-xs font-semibold text-muted-foreground', isTooShort && 'text-gold', isOverLimit && 'text-red-600')}>
          Minimal {minLength} karakter.
        </p>
        <p className={cn('text-right text-xs text-muted-foreground', (isTooShort || isOverLimit) && 'font-bold', isOverLimit && 'text-red-600')}>
          {value.length} / {maxLength}
        </p>
      </div>
    </SectionCard>
  );
}
