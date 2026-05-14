import type { AppRole, ModuleStatus } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { moduleStatuses, roleLabels } from '@/lib/constants/design-system';
import { cn } from '@/lib/utils';

type StatusBadgeProps =
  | {
      type?: 'module';
      status: ModuleStatus;
      label?: string;
      className?: string;
    }
  | {
      type: 'role';
      status: AppRole;
      label?: string;
      className?: string;
    };

export function StatusBadge(props: StatusBadgeProps) {
  const meta = props.type === 'role' ? roleLabels[props.status] : moduleStatuses[props.status];

  return (
    <Badge
      variant="outline"
      className={cn(
        'w-fit rounded-full px-3 py-1 text-xs font-semibold shadow-none',
        meta.className,
        props.className,
      )}
    >
      {props.label ?? meta.label}
    </Badge>
  );
}
