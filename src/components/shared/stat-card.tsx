import type { LucideIcon } from 'lucide-react';
import { TrendingUp } from 'lucide-react';
import { SectionCard } from '@/components/shared/section-card';
import { cn } from '@/lib/utils';

type StatCardProps = {
  label: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  trend?: string;
  tone?: 'emerald' | 'gold' | 'mint';
  className?: string;
  singleLine?: boolean;
};

const toneClass = {
  emerald: 'bg-primary/10 text-primary',
  gold: 'bg-gold/10 text-gold',
  mint: 'bg-mint text-primary',
};

export function StatCard({
  label,
  value,
  description,
  icon: Icon = TrendingUp,
  trend,
  tone = 'emerald',
  className,
  singleLine = false,
}: StatCardProps) {
  return (
    <SectionCard as="article" className={cn('p-4 sm:p-5', className)}>
      <div className="min-w-0">
        <p className="whitespace-nowrap text-sm font-semibold text-muted-foreground">{label}</p>
        <div className="mt-2 flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className={cn('text-2xl font-extrabold text-ink sm:text-3xl', singleLine && 'xl:whitespace-nowrap')}>{value}</p>
            {description && (
              <p className={cn('mt-1 text-xs leading-5 text-muted-foreground', singleLine && 'xl:whitespace-nowrap')}>
                {description}
              </p>
            )}
          </div>
          <div className={cn('grid h-11 w-11 shrink-0 place-items-center rounded-2xl', toneClass[tone])}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </div>
      {trend && <p className="mt-4 text-xs font-semibold text-primary">{trend}</p>}
    </SectionCard>
  );
}
