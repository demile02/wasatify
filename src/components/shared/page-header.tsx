import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type PageHeaderProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: ReactNode;
  className?: string;
};

export function PageHeader({ title, actions, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        'page-header flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-end',
        !actions && 'page-header--quiet',
        className,
      )}
    >
      <h1 className="sr-only">{title}</h1>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
  );
}
