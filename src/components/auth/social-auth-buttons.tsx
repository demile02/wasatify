import { Mail } from 'lucide-react';

export function SocialAuthButtons() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <button
        type="button"
        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 text-sm font-semibold text-foreground shadow-sm transition hover:bg-mint"
      >
        <span className="text-base font-bold text-red-500">G</span>
        Google
      </button>
      <button
        type="button"
        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 text-sm font-semibold text-foreground shadow-sm transition hover:bg-mint"
      >
        <Mail className="h-4 w-4 text-primary" />
        Microsoft
      </button>
    </div>
  );
}
