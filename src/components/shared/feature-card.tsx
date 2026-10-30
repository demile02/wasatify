import type { LucideIcon } from 'lucide-react';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { SectionCard } from '@/components/shared/section-card';
import { cn } from '@/lib/utils';

type FeatureCardProps = {
  title: string;
  description: string;
  icon: LucideIcon;
  href?: string;
  className?: string;
};

export function FeatureCard({ title, description, icon: Icon, href, className }: FeatureCardProps) {
  const content = (
    <SectionCard as="article" className={cn('h-full transition hover:-translate-y-0.5 hover:shadow-soft', className)}>
      <div className="mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-mint text-primary">
        <Icon className="h-7 w-7" />
      </div>
      <h2 className="text-lg font-bold text-ink">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
      {href && (
        <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-gold">
          Lihat detail <ArrowRight className="h-4 w-4" />
        </span>
      )}
    </SectionCard>
  );

  if (!href) return content;

  return (
    <Link href={href} className="block h-full">
      {content}
    </Link>
  );
}
