import type { ReactNode } from 'react';

/** Shared look of text inputs and selects. */
export const inputClass =
  'h-9 w-full min-w-0 rounded-md border border-slate-700 bg-slate-950 px-2.5 text-sm text-slate-100 outline-none transition-colors hover:border-slate-600 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30';

interface FieldProps {
  label: string;
  className?: string;
  /** The form control being labelled. */
  children: ReactNode;
}

/** A form control with its label above it. */
export function Field({ label, className = '', children }: FieldProps) {
  return (
    <label className={`flex min-w-0 flex-col gap-1 text-left ${className}`}>
      <span className="text-xs font-medium text-slate-400">{label}</span>
      {children}
    </label>
  );
}
