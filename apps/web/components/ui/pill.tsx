import Link from 'next/link';
import { cn } from '@/lib/cn';

export function Pill({
  label,
  active,
  onClick,
  href,
  className,
}: {
  label: string;
  active: boolean;
  onClick?: () => void;
  href?: string;
  className?: string;
}) {
  const classNames = cn(
    'inline-flex shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors',
    active
      ? 'border-accent bg-accent text-accent-foreground shadow-card'
      : 'border-line bg-surface text-content-muted hover:border-content-subtle hover:bg-surface-muted hover:text-content',
    className,
  );

  if (href) {
    return (
      <Link href={href} aria-current={active ? 'page' : undefined} className={classNames}>
        {label}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} aria-pressed={active} className={classNames}>
      {label}
    </button>
  );
}
