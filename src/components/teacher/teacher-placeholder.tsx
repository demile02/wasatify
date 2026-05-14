import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';
import { SectionCard } from '@/components/shared/section-card';
import { Button } from '@/components/ui/button';

type TeacherPlaceholderProps = {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  actionLabel?: string;
  actionHref?: string;
};

export function TeacherPlaceholder({
  eyebrow,
  title,
  description,
  icon,
  actionLabel,
  actionHref,
}: TeacherPlaceholderProps) {
  return (
    <div>
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        actions={
          actionLabel && actionHref ? (
            <Button asChild>
              <Link href={actionHref}>{actionLabel}</Link>
            </Button>
          ) : undefined
        }
      />

      <div className="mt-8">
        <SectionCard>
          <EmptyState
            icon={icon}
            title={`${title} siap dikembangkan`}
            description="Struktur route dan shell guru sudah tersedia. Fitur data dan form detail bisa ditambahkan pada fase berikutnya."
          />
        </SectionCard>
      </div>
    </div>
  );
}
