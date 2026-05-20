import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type LoadingSpinnerProps = {
  label?: string;
  className?: string;
  compact?: boolean;
};

export function LoadingSpinner({ label = 'Memuat data...', className, compact = false }: LoadingSpinnerProps) {
  return (
    <div
      className={cn(
        'grid place-items-center text-center text-primary',
        compact ? 'min-h-32' : 'min-h-[45vh]',
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-3">
        <Loader2 className={cn('animate-spin', compact ? 'h-7 w-7' : 'h-10 w-10')} />
        <p className="text-sm font-semibold text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
