'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/cn';

export function AdminBreadcrumb({ current }: { current: string }) {
  return (
    <nav className="mb-1 flex items-center gap-2 text-label-sm text-on-surface-variant">
      <Link href="/" className="transition-colors hover:text-primary">
        Admin
      </Link>
      <span className="material-symbols-outlined text-[14px]">chevron_right</span>
      <span className="text-on-surface">{current}</span>
    </nav>
  );
}

export function AdminPageHeader({
  title,
  description,
  breadcrumb,
  children,
  titleClassName,
  className,
}: {
  title: string;
  description?: string;
  breadcrumb: string;
  children?: React.ReactNode;
  titleClassName?: string;
  className?: string;
}) {
  return (
    <header
      className={cn(
        'mb-stack-lg flex flex-col justify-between gap-4 md:flex-row md:items-end',
        className,
      )}
    >
      <div>
        <AdminBreadcrumb current={breadcrumb} />
        <h1
          className={cn(
            'font-display text-headline-lg tracking-tight text-primary',
            titleClassName,
          )}
        >
          {title}
        </h1>
        {description && (
          <p className="mt-1 max-w-2xl text-body-md text-on-surface-variant">{description}</p>
        )}
      </div>
      {children && <div className="flex flex-wrap items-center gap-3">{children}</div>}
    </header>
  );
}

export function AdminPageShell({
  children,
  contentClassName,
  fillHeight = true,
}: {
  children: React.ReactNode;
  contentClassName?: string;
  fillHeight?: boolean;
}) {
  return (
    <div
      className={cn(
        'admin-page flex flex-col',
        fillHeight ? 'h-screen overflow-hidden' : 'min-h-screen',
      )}
    >
      <div
        className={cn(
          'admin-page-content flex-1',
          fillHeight ? 'flex min-h-0 flex-col overflow-hidden' : 'overflow-y-auto',
          contentClassName,
        )}
      >
        {children}
      </div>
    </div>
  );
}

export function AdminPageBody({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn('flex min-h-0 flex-1 flex-col', className)}>{children}</div>;
}

export function AdminScrollCard({
  header,
  children,
  className,
  bodyClassName,
}: {
  header?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <div className={cn('admin-card flex min-h-0 flex-col overflow-hidden', className)}>
      {header && <div className="shrink-0">{header}</div>}
      <div className={cn('thin-scrollbar min-h-0 flex-1 overflow-auto', bodyClassName)}>
        {children}
      </div>
    </div>
  );
}

export function AdminMetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: React.ReactNode;
}) {
  return (
    <div className="admin-card p-stack-md transition-shadow hover:shadow-panel">
      <p className="mb-stack-xs text-label-sm uppercase tracking-wider text-on-surface-variant">
        {label}
      </p>
      <div className="flex items-baseline gap-2">
        <span className="font-display text-display text-primary">{value}</span>
      </div>
      {hint && <div className="mt-1 text-label-sm text-secondary">{hint}</div>}
    </div>
  );
}

export function AdminInsightCard({
  label,
  value,
  icon,
  accent = 'primary',
  meta,
}: {
  label: string;
  value: string;
  icon: string;
  accent?: 'primary' | 'secondary' | 'tertiary';
  meta?: string;
}) {
  const iconBg = {
    primary: 'bg-primary-container text-on-primary-container',
    secondary: 'bg-secondary-container text-on-secondary-container',
    tertiary: 'bg-tertiary-container text-on-tertiary-container',
  }[accent];

  const barColor = {
    primary: 'bg-primary',
    secondary: 'bg-secondary',
    tertiary: 'bg-tertiary',
  }[accent];

  return (
    <div className="group relative overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest p-stack-md shadow-card">
      <div className="mb-4 flex items-start justify-between">
        <div className={cn('rounded-lg p-2', iconBg)}>
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        {meta && <span className="text-label-sm text-on-surface-variant">{meta}</span>}
      </div>
      <h3 className="text-label-md text-on-surface-variant">{label}</h3>
      <p className="mt-2 font-display text-4xl font-bold text-on-surface">{value}</p>
      <div
        className={cn(
          'absolute bottom-0 left-0 h-1 w-full origin-left scale-x-0 transition-transform group-hover:scale-x-100',
          barColor,
        )}
      />
    </div>
  );
}

export function AdminModal({
  open,
  titleId,
  title,
  description,
  onClose,
  closeDisabled = false,
  children,
  className,
}: {
  open: boolean;
  titleId: string;
  title: string;
  description?: React.ReactNode;
  onClose: () => void;
  closeDisabled?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !closeDisabled) {
        onClose();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, closeDisabled, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <button
        type="button"
        className="absolute inset-0 bg-inverse-surface/60 backdrop-blur-sm"
        aria-label="Close dialog"
        onClick={onClose}
        disabled={closeDisabled}
      />
      <div className="pointer-events-none flex min-h-full items-center justify-center p-4">
        <div
          className={cn(
            'pointer-events-auto relative z-10 w-full max-w-2xl rounded-2xl border border-outline-variant bg-surface p-stack-lg shadow-2xl',
            className,
          )}
          onMouseDown={(event) => event.stopPropagation()}
        >
          <div className="mb-stack-md flex items-start justify-between gap-4">
            <div>
              <h2 id={titleId} className="font-display text-headline-sm text-on-surface">
                {title}
              </h2>
              {description ? (
                <div className="mt-1 text-body-sm text-on-surface-variant">{description}</div>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="admin-btn-secondary px-3 py-1.5 text-label-sm"
              disabled={closeDisabled}
            >
              Close
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

export function AdminStatusBadge({ status, className }: { status: string; className?: string }) {
  const styles: Record<string, string> = {
    DISCOVERED: 'bg-sky-100 text-sky-700',
    SUGGESTED: 'bg-amber-100 text-amber-700',
    APPROVED: 'bg-emerald-100 text-emerald-700',
    REJECTED: 'bg-rose-100 text-rose-700',
    USED: 'bg-surface-container-high text-on-surface-variant',
    EXPIRED: 'bg-surface-container-high text-on-surface-variant/70',
    DRAFT: 'bg-surface-container-high text-on-surface-variant',
    GENERATING: 'bg-amber-100 text-amber-700',
    FAILED: 'bg-rose-100 text-rose-700',
    DUPLICATE_REJECTED: 'bg-rose-100 text-rose-700',
    PUBLISHED: 'bg-emerald-100 text-emerald-700',
    ARCHIVED: 'bg-surface-container-high text-on-surface-variant',
    active: 'bg-sky-100 text-sky-700',
    waiting: 'bg-amber-100 text-amber-700',
    delayed: 'bg-amber-100 text-amber-700',
    completed: 'bg-emerald-100 text-emerald-700',
    failed: 'bg-rose-100 text-rose-700',
  };

  const label = status.replace(/_/g, ' ').toLowerCase();

  return (
    <span
      className={cn(
        'rounded px-2 py-1 text-label-sm capitalize',
        styles[status] ?? 'bg-surface-container-high text-on-surface-variant',
        className,
      )}
    >
      {label}
    </span>
  );
}
