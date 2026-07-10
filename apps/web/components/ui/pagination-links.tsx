import Link from 'next/link';
import { cn } from '@/lib/cn';
import { getVisiblePages } from '@/lib/pagination-utils';

export function PaginationLinks({
  page,
  totalPages,
  buildHref,
}: {
  page: number;
  totalPages: number;
  buildHref: (page: number) => string;
}) {
  if (totalPages <= 1) {
    return null;
  }

  const visiblePages = getVisiblePages(page, totalPages);
  const linkClass =
    'inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-label-md transition-colors';
  const navButtonClass =
    'inline-flex h-9 w-9 items-center justify-center rounded-lg border border-outline-variant text-on-surface-variant transition-colors hover:border-primary/30 hover:text-primary';

  return (
    <nav
      aria-label="Pagination"
      className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-outline-variant pt-6 sm:flex-row"
    >
      <p className="text-body-sm text-on-surface-variant">
        Page <span className="font-medium text-on-surface">{page}</span> of{' '}
        <span className="font-medium text-on-surface">{totalPages}</span>
      </p>

      <div className="flex items-center gap-1">
        {page <= 1 ? (
          <span
            aria-disabled="true"
            className={cn(navButtonClass, 'cursor-not-allowed opacity-40')}
          >
            <span className="material-symbols-outlined text-[20px]">chevron_left</span>
          </span>
        ) : (
          <Link href={buildHref(page - 1)} aria-label="Previous page" className={navButtonClass}>
            <span className="material-symbols-outlined text-[20px]">chevron_left</span>
          </Link>
        )}

        {visiblePages.map((item, index) =>
          item === 'ellipsis' ? (
            <span
              key={`ellipsis-${index}`}
              className="inline-flex h-9 w-9 items-center justify-center text-body-sm text-on-surface-variant"
              aria-hidden="true"
            >
              …
            </span>
          ) : item === page ? (
            <span
              key={item}
              aria-current="page"
              className={cn(linkClass, 'bg-primary font-semibold text-on-primary shadow-card')}
            >
              {item}
            </span>
          ) : (
            <Link
              key={item}
              href={buildHref(item)}
              aria-label={`Page ${item}`}
              className={cn(
                linkClass,
                'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface',
              )}
            >
              {item}
            </Link>
          ),
        )}

        {page >= totalPages ? (
          <span
            aria-disabled="true"
            className={cn(navButtonClass, 'cursor-not-allowed opacity-40')}
          >
            <span className="material-symbols-outlined text-[20px]">chevron_right</span>
          </span>
        ) : (
          <Link href={buildHref(page + 1)} aria-label="Next page" className={navButtonClass}>
            <span className="material-symbols-outlined text-[20px]">chevron_right</span>
          </Link>
        )}
      </div>
    </nav>
  );
}
