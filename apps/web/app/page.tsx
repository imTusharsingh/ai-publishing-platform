import { APP_NAME } from '@repo/shared';

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900">{APP_NAME}</h1>
          <nav className="flex gap-6 text-sm text-gray-600">
            <span>Latest</span>
            <span>Categories</span>
            <span>Search</span>
          </nav>
        </div>
      </header>
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-4xl font-bold tracking-tight text-gray-900">Latest Articles</h2>
        <p className="mt-4 text-lg text-gray-600">
          AI-generated news and insights — updated daily.
        </p>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <article key={i} className="rounded-lg border border-gray-200 p-6 shadow-sm">
              <div className="mb-4 h-40 rounded-md bg-gray-100" />
              <h3 className="font-semibold text-gray-900">Article placeholder {i}</h3>
              <p className="mt-2 text-sm text-gray-500">Coming in Sprint 4</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
