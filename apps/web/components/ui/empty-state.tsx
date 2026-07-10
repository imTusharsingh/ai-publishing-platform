export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-lowest px-6 py-12 text-center shadow-card">
      <p className="text-body-md font-medium text-on-surface">{title}</p>
      <p className="mt-2 text-body-sm leading-6 text-on-surface-variant">{description}</p>
    </div>
  );
}
