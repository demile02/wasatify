import { AppLogo } from '@/components/shared/app-logo';

type BrandProps = {
  className?: string;
  compact?: boolean;
};

export function Brand({ className, compact = false }: BrandProps) {
  return <AppLogo className={className} size={compact ? 'sm' : 'md'} />;
}
