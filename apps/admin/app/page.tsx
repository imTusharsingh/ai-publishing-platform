import { APP_NAME } from '@repo/shared';

export default function AdminHomePage() {
  return (
    <main className="min-h-screen">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900">{APP_NAME} — Admin</h1>
          <span className="text-sm text-gray-500">Login coming in Sprint 6</span>
        </div>
      </header>
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
        <p className="mt-2 text-gray-600">Admin portal shell — Sprint 0</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {['Categories', 'Topics', 'Articles', 'AI Jobs'].map((item) => (
            <div key={item} className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="font-medium text-gray-900">{item}</h3>
              <p className="mt-1 text-sm text-gray-500">Coming soon</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
