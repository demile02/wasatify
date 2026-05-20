import Image from 'next/image';
import { cn } from '@/lib/utils';

type LogoMarkProps = {
  className?: string;
};

export function LogoMark({ className }: LogoMarkProps) {
  return (
    <span
      className={cn(
        'relative inline-grid place-items-center overflow-hidden rounded-[1.1rem] border border-white/20 bg-dark-emerald shadow-sm',
        className,
      )}
      aria-hidden="true"
    >
      <Image
        src="/brand/wasatify-logo.png"
        alt=""
        fill
        sizes="56px"
        className="object-cover"
        priority
      />
    </span>
  );
}
