'use client';

import { useEffect, useRef, useState, type InputHTMLAttributes } from 'react';

type EditableNumberInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> & {
  value: number;
  onValueChange: (value: number) => void;
};

export function EditableNumberInput({ value, onValueChange, min, max, step, ...props }: EditableNumberInputProps) {
  const [draft, setDraft] = useState(formatValue(value));
  const isFocused = useRef(false);
  const effectiveStep = step ?? 1;

  useEffect(() => {
    if (!isFocused.current) setDraft(formatValue(value));
  }, [value]);

  function handleBlur() {
    isFocused.current = false;
    const parsed = parseValue(draft);

    if (parsed === null) {
      setDraft(formatValue(value));
      return;
    }

    const normalized = normalizeValue(parsed, min, max, effectiveStep);
    if (normalized !== value) onValueChange(normalized);
    setDraft(formatValue(normalized));
  }

  return (
    <input
      {...props}
      type="number"
      min={min}
      max={max}
      step={effectiveStep}
      value={draft}
      onFocus={() => { isFocused.current = true; }}
      onChange={(event) => {
        const nextDraft = event.currentTarget.value;
        setDraft(nextDraft);
        const parsed = parseValue(nextDraft);
        if (parsed !== null) onValueChange(parsed);
      }}
      onBlur={handleBlur}
    />
  );
}

function parseValue(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeValue(value: number, min?: number | string, max?: number | string, step?: number | string) {
  let normalized = value;
  const minimum = min === undefined ? undefined : Number(min);
  const maximum = max === undefined ? undefined : Number(max);
  const stepValue = step === undefined || step === 'any' ? undefined : Number(step);

  if (minimum !== undefined && Number.isFinite(minimum)) normalized = Math.max(minimum, normalized);
  if (maximum !== undefined && Number.isFinite(maximum)) normalized = Math.min(maximum, normalized);
  if (stepValue === 1) normalized = Math.round(normalized);

  return normalized;
}

function formatValue(value: number) {
  return Number.isFinite(value) ? String(value) : '';
}
