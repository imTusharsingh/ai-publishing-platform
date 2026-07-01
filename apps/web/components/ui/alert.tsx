import { cn } from '@/lib/cn';

export function Alert({
  children,
  variant = 'danger',
  className,
}: {
  children: React.ReactNode;
  variant?: 'danger';
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-xl border px-4 py-3 text-sm',
        variant === 'danger' && 'border-error-container bg-error-container text-on-error-container',
        className,
      )}
    >
      {children}
    </div>
  );
}
