import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type SectionCardProps = HTMLAttributes<HTMLElement> & {
  as?: 'article' | 'section' | 'div';
  variant?: 'surface' | 'muted' | 'brand';
  padded?: boolean;
};

const variantClass = {
  surface: 'border-primary/10 bg-surface text-foreground shadow-card',
  muted: 'border-primary/10 bg-mint/55 text-foreground shadow-card',
  brand: 'border-primary/15 bg-primary text-primary-foreground shadow-soft',
};

export function SectionCard({
  as: Component = 'section',
  variant = 'surface',
  padded = true,
  className,
  children,
  ...props
}: SectionCardProps) {
  return (
    <Component
      className={cn(
        'min-w-0 rounded-[1.25rem] border backdrop-blur-sm',
        padded && 'p-5 sm:p-6',
        variantClass[variant],
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  );
}
