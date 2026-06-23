export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface px-6 py-12 text-center shadow-card">
      <p className="text-base font-medium text-content">{title}</p>
      <p className="mt-2 text-sm leading-6 text-content-muted">{description}</p>
    </div>
  );
}
