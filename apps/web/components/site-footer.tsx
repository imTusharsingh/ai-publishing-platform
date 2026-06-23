import { APP_NAME } from '@repo/shared';

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="page-container flex flex-col gap-2 py-8 text-sm text-content-muted sm:flex-row sm:items-center sm:justify-between">
        <p>
          &copy; {new Date().getFullYear()} {APP_NAME}
        </p>
        <p className="text-content-subtle">AI-generated news and insights</p>
      </div>
    </footer>
  );
}
