import type { ButtonHTMLAttributes } from 'react';

const base =
  'inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-md font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400 disabled:pointer-events-none disabled:opacity-50';

const variants = {
  primary: 'bg-indigo-500 text-white hover:bg-indigo-400',
  secondary:
    'border border-slate-700 bg-slate-800 text-slate-200 hover:border-slate-600 hover:bg-slate-700',
  ghost: 'text-slate-400 hover:bg-slate-800 hover:text-slate-100',
};

const sizes = {
  sm: 'h-7 px-2.5 text-xs',
  md: 'h-9 px-3.5 text-sm',
  icon: 'size-9 text-lg',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
}

export function Button({
  variant = 'secondary',
  size = 'md',
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  );
}
