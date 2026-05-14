import Image from 'next/image';
import Link from 'next/link';
import { BookOpen, Clock, Lock } from 'lucide-react';
import { ProgressBar } from '@/components/shared/progress-bar';
import { SectionCard } from '@/components/shared/section-card';
import { StatusBadge } from '@/components/shared/status-badge';
import type { ModuleStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

type ModuleCardProps = {
  title: string;
  description: string;
  status: ModuleStatus;
  imageSrc?: string;
  href?: string;
  lessonsCount?: number;
  duration?: string;
  progress?: number;
  className?: string;
};

export function ModuleCard({
  title,
  description,
  status,
  imageSrc = '/assets/wasatify-module-art.png',
  href,
  lessonsCount,
  duration,
  progress = 0,
  className,
}: ModuleCardProps) {
  const locked = status === 'locked';
  const card = (
    <SectionCard
      as="article"
      padded={false}
      className={cn(
        'h-full overflow-hidden transition',
        href && !locked && 'hover:-translate-y-0.5 hover:shadow-soft',
        locked && 'opacity-75',
        className,
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-mint">
        <Image src={imageSrc} alt="" fill sizes="(min-width: 1024px) 33vw, 100vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/55 to-transparent" />
        <div className="absolute left-4 top-4">
          <StatusBadge status={status} />
        </div>
        {locked && (
          <div className="absolute inset-0 grid place-items-center bg-white/40 backdrop-blur-[1px]">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-white text-muted-foreground shadow-card">
              <Lock className="h-5 w-5" />
            </div>
          </div>
        )}
      </div>
      <div className="p-5">
        <h2 className="line-clamp-2 text-lg font-bold text-ink">{title}</h2>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{description}</p>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-semibold text-muted-foreground">
          {typeof lessonsCount === 'number' && (
            <span className="inline-flex items-center gap-1.5">
              <BookOpen className="h-4 w-4 text-primary" />
              {lessonsCount} pelajaran
            </span>
          )}
          {duration && (
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-gold" />
              {duration}
            </span>
          )}
        </div>
        <ProgressBar value={locked ? 0 : progress} showValue className="mt-5" />
      </div>
    </SectionCard>
  );

  if (!href || locked) return card;

  return (
    <Link href={href} className="block h-full">
      {card}
    </Link>
  );
}
