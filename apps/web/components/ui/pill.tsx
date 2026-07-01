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
    'inline-flex shrink-0 rounded-full border px-4 py-2 text-label-md transition-colors',
    active
      ? 'border-primary bg-primary text-on-primary shadow-card'
      : 'border-outline-variant bg-surface text-on-surface-variant hover:border-primary/30 hover:bg-surface-container-low hover:text-primary',
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
