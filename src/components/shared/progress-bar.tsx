import { cn } from '@/lib/utils';

type ProgressBarProps = {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  className?: string;
  trackClassName?: string;
  indicatorClassName?: string;
};

export function ProgressBar({
  value,
  max = 100,
  label,
  showValue = false,
  className,
  trackClassName,
  indicatorClassName,
}: ProgressBarProps) {
  const normalized = Math.min(Math.max(value, 0), max);
  const percent = max > 0 ? Math.round((normalized / max) * 100) : 0;

  return (
    <div className={cn('w-full', className)}>
      {(label || showValue) && (
        <div className="mb-2 flex items-center justify-between gap-3 text-sm">
          {label && <span className="font-semibold text-foreground">{label}</span>}
          {showValue && <span className="font-semibold text-primary">{percent}%</span>}
        </div>
      )}
      <div
        className={cn('h-3 overflow-hidden rounded-full bg-slate-100', trackClassName)}
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? 'Progress'}
      >
        <div
          className={cn('h-full rounded-full bg-primary transition-all duration-500', indicatorClassName)}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
