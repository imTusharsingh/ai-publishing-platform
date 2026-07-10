export function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-3">
      <h1 className="font-display text-headline-lg tracking-tight text-on-surface sm:text-display">
        {title}
      </h1>
      <p className="max-w-2xl text-body-md leading-7 text-on-surface-variant sm:text-body-lg">
        {description}
      </p>
    </div>
  );
}
