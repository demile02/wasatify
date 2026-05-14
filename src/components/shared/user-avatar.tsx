import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

type UserAvatarProps = {
  name?: string | null;
  imageUrl?: string | null;
  roleLabel?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
};

const avatarSizeClass = {
  sm: 'h-9 w-9 text-xs',
  md: 'h-11 w-11 text-sm',
  lg: 'h-14 w-14 text-base',
};

export function UserAvatar({ name, imageUrl, roleLabel, className, size = 'md' }: UserAvatarProps) {
  const initials = getInitials(name);

  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar
        className={cn(
          'border border-primary/10 bg-mint font-bold text-primary shadow-sm',
          avatarSizeClass[size],
          className,
        )}
      >
        {imageUrl && <AvatarImage src={imageUrl} alt={name ?? 'Avatar pengguna'} className="object-cover" />}
        <AvatarFallback className="bg-mint font-bold text-primary">{initials}</AvatarFallback>
      </Avatar>
      {(name || roleLabel) && (
        <span className="min-w-0 leading-tight">
          {name && <span className="block truncate text-sm font-semibold text-foreground">{name}</span>}
          {roleLabel && <span className="block truncate text-xs text-muted-foreground">{roleLabel}</span>}
        </span>
      )}
    </div>
  );
}

function getInitials(name?: string | null) {
  if (!name) return 'WA';

  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}
