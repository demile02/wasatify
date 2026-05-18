'use client';

import { useRouter } from 'next/navigation';
import { SectionCard } from '@/components/shared/section-card';
import type { ReflectionModuleOption } from '@/lib/student/reflection';

type ReflectionModuleJumpSelectProps = {
  modules: ReflectionModuleOption[];
};

export function ReflectionModuleJumpSelect({ modules }: ReflectionModuleJumpSelectProps) {
  const router = useRouter();

  if (!modules.length) return null;

  return (
    <SectionCard className="p-4">
      <label className="grid gap-2 sm:max-w-md">
        <span className="text-sm font-bold text-ink">Filter / pilih modul</span>
        <select
          className="h-12 rounded-xl border border-border bg-white px-4 text-sm font-semibold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
          defaultValue=""
          onChange={(event) => {
            if (event.currentTarget.value) router.push(`/student/reflection?moduleId=${event.currentTarget.value}`);
          }}
        >
          <option value="">Pilih modul untuk menulis refleksi...</option>
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
