import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type AuthAlertProps = {
  type: 'error' | 'success';
  message: string;
};

export function AuthAlert({ type, message }: AuthAlertProps) {
  const Icon = type === 'error' ? AlertCircle : CheckCircle2;

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm leading-6',
        type === 'error'
          ? 'border-red-200 bg-red-50 text-red-700'
          : 'border-emerald-100 bg-emerald-50 text-emerald-800',
      )}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" />
      <p>{message}</p>
    </div>
  );
}
