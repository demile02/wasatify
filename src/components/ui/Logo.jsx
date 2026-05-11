import { Sparkles } from 'lucide-react';
import { cn } from '../../utils/cn';

export function Logo({ light = false, subtitle = 'Wasathiyah Smart Learning', compact = false }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          'grid h-11 w-11 place-items-center rounded-2xl border shadow-sm',
          light ? 'border-cream/30 bg-cream text-emerald-800' : 'border-emerald-100 bg-emerald-50 text-emerald-700',
        )}
      >
        <Sparkles className="h-6 w-6" />
      </div>
      {!compact && (
        <div>
          <p className={cn('font-display text-xl font-extrabold leading-5 tracking-wide', light ? 'text-white' : 'text-ink')}>
            WASATIFY
          </p>
          <p className={cn('text-[11px] font-semibold', light ? 'text-emerald-50/80' : 'text-slate-500')}>{subtitle}</p>
        </div>
      )}
    </div>
  );
}
