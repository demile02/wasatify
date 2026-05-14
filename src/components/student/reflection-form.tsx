'use client';

import { useMemo, useState, useTransition } from 'react';
import { PenLine, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { EmptyState } from '@/components/shared/empty-state';
import { ProgressBar } from '@/components/shared/progress-bar';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { submitReflectionAction } from '@/lib/student/actions';
import type { ReflectionModuleOption } from '@/lib/student/reflection';
import { cn } from '@/lib/utils';

type ReflectionFormProps = {
  modules: ReflectionModuleOption[];
};

const maxLength = 500;

export function ReflectionForm({ modules }: ReflectionFormProps) {
  const firstAvailableModule = modules[0]?.id ?? '';
  const [moduleId, setModuleId] = useState(firstAvailableModule);
  const [reflectionText, setReflectionText] = useState('');
  const [actionPlan, setActionPlan] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedModule = useMemo(
    () => modules.find((moduleItem) => moduleItem.id === moduleId),
    [moduleId, modules],
  );
  const isOverLimit = reflectionText.length > maxLength || actionPlan.length > maxLength;
  const canSubmit = Boolean(moduleId && reflectionText.trim() && actionPlan.trim() && !isOverLimit && !isPending);

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

      setReflectionText('');
      setActionPlan('');
      toast.success('Refleksi berhasil disimpan.');
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="reflection-module" className="text-sm font-bold text-ink">
          Pilih modul
        </label>
        <select
          id="reflection-module"
          value={moduleId}
          onChange={(event) => setModuleId(event.target.value)}
          className="mt-2 h-12 w-full rounded-xl border border-border bg-white px-4 text-sm font-semibold text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
        >
          {modules.map((moduleItem) => (
            <option key={moduleItem.id} value={moduleItem.id}>
              {moduleItem.title}
            </option>
          ))}
        </select>

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
      </div>

      <ReflectionField
        icon={PenLine}
        title="Refleksi Diri"
        description="Apa pelajaran paling berkesan yang kamu dapatkan hari ini?"
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
        {isPending ? 'Menyimpan...' : 'Simpan Refleksi'}
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
    <div>
      <div className="mb-3 flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-mint text-primary">
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="font-bold text-ink">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-h-36 w-full resize-none rounded-2xl border border-border bg-white px-4 py-3 text-sm leading-6 outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:ring-4 focus:ring-primary/10"
      />
      <p className={cn('mt-2 text-right text-xs text-muted-foreground', isOverLimit && 'font-bold text-red-600')}>
        {value.length} / {maxLength}
      </p>
    </div>
  );
}
