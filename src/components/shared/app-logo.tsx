import Link from 'next/link';
import { LogoMark } from '@/components/shared/logo-mark';
import { cn } from '@/lib/utils';

type AppLogoProps = {
  className?: string;
  href?: string;
  markOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  theme?: 'light' | 'dark';
};

const sizeClass = {
  sm: {
    mark: 'h-10 w-10',
    title: 'text-lg',
    subtitle: 'text-[10px]',
  },
  md: {
    mark: 'h-11 w-11',
    title: 'text-xl',
    subtitle: 'text-xs',
  },
  lg: {
    mark: 'h-14 w-14',
    title: 'text-3xl',
    subtitle: 'text-sm',
  },
};

export function AppLogo({
  className,
  href,
  markOnly = false,
  size = 'md',
  theme = 'light',
}: AppLogoProps) {
  const content = (
    <div className={cn('inline-flex items-center gap-3', className)}>
      <LogoMark className={sizeClass[size].mark} />
      {!markOnly && (
        <div className="leading-none">
          <p
            className={cn(
              'font-extrabold tracking-wide',
              sizeClass[size].title,
              theme === 'dark' ? 'text-white' : 'text-ink',
            )}
          >
            WASATIFY
          </p>
          <p
            className={cn(
              'mt-1 font-medium',
              sizeClass[size].subtitle,
              theme === 'dark' ? 'text-white/72' : 'text-muted-foreground',
            )}
          >
            Belajar Islam Wasathiyah
          </p>
        </div>
      )}
    </div>
  );

  if (!href) return content;

  return (
    <Link href={href} aria-label="WASATIFY beranda" className="inline-flex">
      {content}
    </Link>
  );
}
