import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function Field({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <label className={cn('min-w-0', className)}>
      <span className="mb-2 block text-sm font-bold text-ink">{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  'h-12 min-w-0 w-full rounded-xl border border-border bg-white px-4 text-sm font-semibold text-foreground outline-none transition placeholder:text-muted-foreground/60 focus:border-primary focus:ring-4 focus:ring-primary/10';

