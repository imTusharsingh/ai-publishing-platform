import { cn } from '@/lib/cn';

export function Panel({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        'rounded-xl border border-outline-variant bg-surface-container-lowest p-4 shadow-panel sm:p-5',
        className,
      )}
    >
      {children}
    </div>
  );
}
