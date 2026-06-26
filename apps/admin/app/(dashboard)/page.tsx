export default function DashboardPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
      <p className="mt-2 text-gray-600">Welcome to the admin portal.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <a
          href="/categories"
          className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:border-gray-300"
        >
          <h3 className="font-medium text-gray-900">Categories</h3>
          <p className="mt-1 text-sm text-gray-500">Manage categories</p>
        </a>
        <a
          href="/topics"
          className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:border-gray-300"
        >
          <h3 className="font-medium text-gray-900">Topics</h3>
          <p className="mt-1 text-sm text-gray-500">Trend discovery</p>
        </a>
        <a
          href="/ideas"
          className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:border-gray-300"
        >
          <h3 className="font-medium text-gray-900">Article ideas</h3>
          <p className="mt-1 text-sm text-gray-500">Draft and approve ideas</p>
        </a>
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="font-medium text-gray-900">Articles</h3>
          <p className="mt-1 text-sm text-gray-500">Coming soon</p>
        </div>
      </div>
    </section>
  );
}
