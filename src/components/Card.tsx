import type { ReactNode } from 'react';

interface CardProps {
  title?: string;
  /** Control shown at the right of the title. */
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function Card({ title, action, className = '', children }: CardProps) {
  return (
    <section
      className={`rounded-xl border border-slate-800 bg-slate-900/70 p-4 ${className}`}
    >
      {(title || action) && (
        <div className="mb-3 flex min-h-7 items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-slate-100">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
