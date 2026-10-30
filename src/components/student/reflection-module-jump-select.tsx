'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { SectionCard } from '@/components/shared/section-card';
import type { ReflectionModuleOption } from '@/lib/student/reflection';

type ReflectionModuleJumpSelectProps = {
  modules: ReflectionModuleOption[];
  selectedModuleId?: string;
  basePath?: string;
};

export function ReflectionModuleJumpSelect({ modules, selectedModuleId, basePath = '/student' }: ReflectionModuleJumpSelectProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (!modules.length) return null;

  return (
    <SectionCard className="p-4">
      <label className="grid w-full gap-2">
        <span className="text-sm font-bold text-ink">Filter / pilih modul</span>
        <select
          className="h-12 w-full rounded-xl border border-border bg-white px-4 text-sm font-semibold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
          value={selectedModuleId ?? ''}
          disabled={isPending}
          onChange={(event) => {
            const nextModuleId = event.currentTarget.value;
            event.currentTarget.blur();

            if (!nextModuleId || nextModuleId === selectedModuleId) return;

            startTransition(() => {
              router.replace(`${basePath}/reflection?moduleId=${encodeURIComponent(nextModuleId)}`);
            });
          }}
        >
          <option value="">{isPending ? 'Membuka refleksi...' : 'Pilih modul untuk menulis refleksi...'}</option>
          {modules.map((moduleItem) => (
            <option key={moduleItem.id} value={moduleItem.id}>
              {moduleItem.title}
            </option>
          ))}
        </select>
      </label>
    </SectionCard>
  );
}
