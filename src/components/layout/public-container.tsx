import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type PublicContainerProps<T extends ElementType = 'div'> = {
  as?: T;
  children: ReactNode;
  className?: string;
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'children' | 'className'>;

export function PublicContainer<T extends ElementType = 'div'>({
  as,
  children,
  className,
  ...props
}: PublicContainerProps<T>) {
  const Component = as ?? 'div';

  return (
    <Component
      className={cn('mx-auto w-full max-w-[1536px] px-4 sm:px-6 lg:px-8 xl:px-10', className)}
      {...props}
    >
      {children}
    </Component>
  );
}
