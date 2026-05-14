import { forwardRef, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string;
  leftIcon?: ReactNode;
};

export const AuthInput = forwardRef<HTMLInputElement, FieldProps>(
  ({ label, hint, error, leftIcon, className, ...props }, ref) => {
    return (
      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-ink">{label}</span>
        <span className="relative block">
          {leftIcon && <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">{leftIcon}</span>}
          <Input
            ref={ref}
            {...props}
            aria-invalid={error ? true : props['aria-invalid']}
            className={cn(
              'h-12 rounded-xl border-border bg-white px-4 text-sm text-foreground shadow-sm transition placeholder:text-muted-foreground/70 focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/10 focus-visible:ring-offset-0',
              leftIcon && 'pl-11',
              error && 'border-destructive focus-visible:border-destructive focus-visible:ring-destructive/10',
              className,
            )}
          />
        </span>
        {error ? (
          <span className="mt-2 block text-xs font-semibold leading-5 text-destructive">{error}</span>
        ) : (
          hint && <span className="mt-2 block text-xs leading-5 text-muted-foreground">{hint}</span>
        )}
      </label>
    );
  },
);
AuthInput.displayName = 'AuthInput';

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  hint?: string;
  error?: string;
};

export const AuthTextarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, hint, error, className, ...props }, ref) => {
    return (
      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-ink">{label}</span>
        <Textarea
          ref={ref}
          {...props}
          aria-invalid={error ? true : props['aria-invalid']}
          className={cn(
            'min-h-24 rounded-xl border-border bg-white px-4 py-3 text-sm text-foreground shadow-sm transition placeholder:text-muted-foreground/70 focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/10 focus-visible:ring-offset-0',
            error && 'border-destructive focus-visible:border-destructive focus-visible:ring-destructive/10',
            className,
          )}
        />
        {error ? (
          <span className="mt-2 block text-xs font-semibold leading-5 text-destructive">{error}</span>
        ) : (
          hint && <span className="mt-2 block text-xs leading-5 text-muted-foreground">{hint}</span>
        )}
      </label>
    );
  },
);
AuthTextarea.displayName = 'AuthTextarea';
