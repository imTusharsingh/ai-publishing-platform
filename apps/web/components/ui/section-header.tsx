export function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-3">
      <h1 className="text-3xl font-bold tracking-tight text-content sm:text-4xl">{title}</h1>
      <p className="max-w-2xl text-base leading-7 text-content-muted sm:text-lg">{description}</p>
    </div>
  );
}
