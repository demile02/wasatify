import Link from 'next/link';
import { LogoMark } from '@/components/shared/logo-mark';
import { cn } from '@/lib/utils';

type AppLogoProps = {
  className?: string;
  href?: string;
  markOnly?: boolean;
  variant?: 'full' | 'horizontal' | 'compact';
  size?: 'sm' | 'md' | 'lg';
  theme?: 'light' | 'dark';
};

const sizeClass = {
  sm: {
    mark: 'h-10 w-10',
    title: 'text-lg leading-[18px]',
    subtitle: 'mt-0.5 max-w-32 whitespace-normal text-justify [text-justify:inter-character] text-[10px] leading-none [text-align-last:justify] sm:max-w-none sm:whitespace-nowrap sm:text-left sm:leading-tight sm:[text-align-last:auto]',
  },
  md: {
    mark: 'h-11 w-11',
    title: 'text-xl',
    subtitle: 'mt-0.5 whitespace-nowrap text-xs leading-tight',
  },
  lg: {
    mark: 'h-14 w-14',
    title: 'text-3xl',
    subtitle: 'mt-0.5 whitespace-nowrap text-sm leading-tight',
  },
};

export function AppLogo({
  className,
  href,
  markOnly = false,
  variant = 'full',
  size = 'md',
  theme = 'light',
}: AppLogoProps) {
  const resolvedVariant = markOnly ? 'compact' : variant;
  const showText = resolvedVariant !== 'compact';
  const showTagline = resolvedVariant === 'full';

  const content = (
    <div className={cn('inline-flex items-center gap-2.5 align-middle sm:gap-3', className)}>
      <LogoMark className={sizeClass[size].mark} />
      {showText && (
        <div className="min-w-0 leading-none">
          <p
            className={cn(
              'truncate font-extrabold leading-none tracking-wide',
              sizeClass[size].title,
              theme === 'dark' ? 'text-white' : 'text-ink',
            )}
          >
            WASATIFY
          </p>
          {showTagline && (
            <p
              className={cn(
                'font-medium',
                sizeClass[size].subtitle,
                theme === 'dark' ? 'text-white/72' : 'text-muted-foreground',
              )}
            >
              Wasathiyah Smart<br className="sm:hidden" /> Learning for Youth
            </p>
          )}
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
