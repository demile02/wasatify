'use client';

import { useMemo, useState, useTransition } from 'react';
import { PenLine, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { EmptyState } from '@/components/shared/empty-state';
import { ProgressBar } from '@/components/shared/progress-bar';
import { SectionCard } from '@/components/shared/section-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { submitReflectionAction } from '@/lib/student/actions';
import type { ReflectionDraft, ReflectionModuleOption } from '@/lib/student/reflection';
import { cn } from '@/lib/utils';

type ReflectionFormProps = {
  modules: ReflectionModuleOption[];
  selectedModuleId?: string;
  existingReflection?: ReflectionDraft | null;
};

const maxLength = 500;

export function ReflectionForm({ modules, selectedModuleId, existingReflection }: ReflectionFormProps) {
  const firstAvailableModule = selectedModuleId ?? modules[0]?.id ?? '';
  const [moduleId, setModuleId] = useState(firstAvailableModule);
  const [reflectionText, setReflectionText] = useState(existingReflection?.reflectionText ?? '');
  const [actionPlan, setActionPlan] = useState(existingReflection?.actionPlan ?? '');
  const [error, setError] = useState<string | null>(null);
  const [hasSaved, setHasSaved] = useState(Boolean(existingReflection));
  const [isPending, startTransition] = useTransition();

  const selectedModule = useMemo(
    () => modules.find((moduleItem) => moduleItem.id === moduleId),
    [moduleId, modules],
  );
  const isOverLimit = reflectionText.length > maxLength || actionPlan.length > maxLength;
  const canSubmit = Boolean(moduleId && reflectionText.trim().length >= 30 && actionPlan.trim().length >= 20 && !isOverLimit && !isPending);

  if (!modules.length) {
    return (
      <EmptyState
        title="Belum ada modul untuk direfleksikan"
        description="Refleksi dapat dibuat setelah modul published tersedia untuk akunmu."
      />
    );
  }

  function submitReflection() {
    setError(null);

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
        return;
      }

      setHasSaved(true);
      toast.success('Refleksi berhasil disimpan.');
    });
  }

  return (
    <div className="space-y-6">
      <SectionCard>
        <label htmlFor="reflection-module" className="text-sm font-bold text-ink">
          {selectedModuleId ? 'Modul dipilih' : 'Pilih modul'}
        </label>
        <Select value={moduleId} onValueChange={setModuleId} disabled={Boolean(selectedModuleId)}>
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
      />

      <ReflectionField
        icon={ShieldCheck}
        title="Aksi Nyata"
        description="Apa tindakan kecil yang akan kamu lakukan setelah belajar hari ini?"
        placeholder="Tuliskan aksi nyata yang akan kamu lakukan..."
        value={actionPlan}
        onChange={setActionPlan}
      />

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      <Button type="button" className="w-full" disabled={!canSubmit} onClick={submitReflection}>
        {isPending ? 'Menyimpan...' : hasSaved ? 'Perbarui Refleksi' : 'Simpan Refleksi'}
      </Button>

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
}: {
  icon: typeof PenLine;
  title: string;
  description: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const isOverLimit = value.length > maxLength;

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
      <p className={cn('mt-2 text-right text-xs text-muted-foreground', isOverLimit && 'font-bold text-red-600')}>
        {value.length} / {maxLength}
      </p>
    </SectionCard>
  );
}
