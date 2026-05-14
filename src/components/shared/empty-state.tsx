import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({
  title,
  description,
  icon: Icon = BookOpen,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'grid min-h-64 place-items-center rounded-2xl border border-dashed border-primary/15 bg-mint/35 p-6 text-center',
        className,
      )}
    >
      <div className="mx-auto max-w-sm">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-white text-primary shadow-sm">
          <Icon className="h-7 w-7" />
        </div>
        <h2 className="text-lg font-bold text-ink">{title}</h2>
        {description && <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>}
        {action && <div className="mt-5 flex justify-center">{action}</div>}
      </div>
    </div>
  );
}
