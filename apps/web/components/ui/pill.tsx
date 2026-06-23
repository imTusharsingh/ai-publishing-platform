import { cn } from '@/lib/cn';

export function Pill({
  label,
  active,
  onClick,
  className,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors',
        active
          ? 'border-accent bg-accent text-accent-foreground shadow-card'
          : 'border-line bg-surface text-content-muted hover:border-content-subtle hover:bg-surface-muted hover:text-content',
        className,
      )}
    >
      {label}
    </button>
  );
}
