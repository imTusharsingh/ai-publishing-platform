export function getVisiblePages(page: number, totalPages: number): (number | 'ellipsis')[] {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages: (number | 'ellipsis')[] = [1];

  if (page > 3) {
    pages.push('ellipsis');
  }

  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);

  for (let current = start; current <= end; current += 1) {
    pages.push(current);
  }

  if (page < totalPages - 2) {
    pages.push('ellipsis');
  }

  if (totalPages > 1) {
    pages.push(totalPages);
  }

  return pages;
}
