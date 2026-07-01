import { Button } from '@/components/ui/button';
import { Panel } from '@/components/ui/panel';

export function Pagination({
  page,
  totalPages,
  onPrevious,
  onNext,
}: {
  page: number;
  totalPages: number;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <Panel className="mt-10 flex items-center justify-between py-3">
      <Button variant="secondary" disabled={page <= 1} onClick={onPrevious}>
        Previous
      </Button>
      <span className="text-body-sm text-on-surface-variant">
        Page {page} of {totalPages}
      </span>
      <Button variant="secondary" disabled={page >= totalPages} onClick={onNext}>
        Next
      </Button>
    </Panel>
  );
}
