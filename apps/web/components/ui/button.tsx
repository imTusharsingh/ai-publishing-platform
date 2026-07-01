import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'border-primary bg-primary text-on-primary hover:opacity-90',
  secondary:
    'border-outline-variant bg-surface-container-lowest text-on-surface hover:bg-surface-container-low',
  ghost:
    'border-transparent bg-transparent text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export function Button({ variant = 'secondary', className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
