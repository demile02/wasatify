'use client';

import { type FocusEvent, type MutableRefObject, type Ref, useMemo, useRef, useState } from 'react';
import { Mail } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type EmailInputWithSuggestionsProps = {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  name?: string;
  onBlur?: (event: FocusEvent<HTMLInputElement>) => void;
  inputRef?: Ref<HTMLInputElement>;
  error?: string;
  placeholder?: string;
  autoComplete?: string;
};

const emailDomains = [
  'gmail.com',
  'yahoo.com',
  'yahoo.co.id',
  'outlook.com',
  'hotmail.com',
  'icloud.com',
  'proton.me',
  'live.com',
];

export function EmailInputWithSuggestions({
  label,
  value,
  onValueChange,
  name,
  onBlur,
  inputRef,
  error,
  placeholder = 'nama@email.com',
  autoComplete = 'email',
}: EmailInputWithSuggestionsProps) {
  const localInputRef = useRef<HTMLInputElement | null>(null);
  const [open, setOpen] = useState(false);
  const suggestions = useMemo(() => getDomainSuggestions(value), [value]);

  function setRefs(node: HTMLInputElement | null) {
    localInputRef.current = node;
    if (typeof inputRef === 'function') {
      inputRef(node);
    } else if (inputRef && 'current' in inputRef) {
      (inputRef as MutableRefObject<HTMLInputElement | null>).current = node;
    }
  }

  function applyDomain(domain: string) {
    const localPart = value.split('@')[0]?.trim() ?? '';
    if (!localPart) return;
    onValueChange(`${localPart}@${domain}`);
    setOpen(false);
    requestAnimationFrame(() => localInputRef.current?.focus());
  }

  const showSuggestions = open && suggestions.length > 0;

  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-ink">{label}</span>
      <span className="relative block">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
          <Mail className="h-4 w-4" />
        </span>
        <Input
          ref={setRefs}
          name={name}
          value={value}
          onChange={(event) => {
            onValueChange(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={(event) => {
            window.setTimeout(() => setOpen(false), 120);
            onBlur?.(event);
          }}
          type="email"
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={error ? true : undefined}
          className={cn(
            'h-12 rounded-xl border-border bg-white px-4 pl-11 text-sm text-foreground shadow-sm transition placeholder:text-muted-foreground/70 focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/10 focus-visible:ring-offset-0',
            error && 'border-destructive focus-visible:border-destructive focus-visible:ring-destructive/10',
          )}
        />

        {showSuggestions && (
          <span className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-[90] overflow-hidden rounded-2xl border border-border bg-white p-1 shadow-soft">
            {suggestions.map((domain) => (
              <button
                key={domain}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => applyDomain(domain)}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-foreground transition hover:bg-mint hover:text-primary"
              >
                <span>{value.split('@')[0] || 'nama'}@{domain}</span>
                <span className="text-xs text-muted-foreground">{domain}</span>
              </button>
            ))}
          </span>
        )}
      </span>
      {error && <span className="mt-2 block text-xs font-semibold leading-5 text-destructive">{error}</span>}
    </label>
  );
}

function getDomainSuggestions(email: string) {
  const atIndex = email.indexOf('@');
  if (atIndex < 1) return [];

  const domainFragment = email.slice(atIndex + 1).trim().toLowerCase();
  if (domainFragment.includes('.')) return [];

  return emailDomains.filter((domain) => domain.startsWith(domainFragment)).slice(0, 6);
}
