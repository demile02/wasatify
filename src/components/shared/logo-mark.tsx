import { BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

type LogoMarkProps = {
  className?: string;
};

export function LogoMark({ className }: LogoMarkProps) {
  return (
    <span
      className={cn(
        'relative inline-grid place-items-center rounded-[1.1rem] border-2 border-primary bg-white text-primary shadow-sm',
        className,
      )}
      aria-hidden="true"
    >
      <span className="absolute inset-1 rounded-[0.8rem] border border-gold/70" />
      <BookOpen className="relative h-1/2 w-1/2 text-gold" strokeWidth={2.4} />
    </span>
  );
}
