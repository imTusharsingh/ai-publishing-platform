'use client';

import { useQuery } from '@tanstack/react-query';
import { listAuditLogs } from '@/lib/audit-api';

export function AuditPage() {
  const auditQuery = useQuery({
    queryKey: ['admin-audit-logs'],
    queryFn: () => listAuditLogs(),
  });

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <h2 className="text-3xl font-bold text-gray-900">Audit log</h2>
      <p className="mt-2 text-gray-600">Recent admin actions across the platform.</p>

      <div className="mt-8 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {auditQuery.isLoading && (
          <p className="p-6 text-sm text-gray-500">Loading audit entries…</p>
        )}
        {auditQuery.isError && (
          <p className="p-6 text-sm text-red-600">Failed to load audit log.</p>
        )}
        {auditQuery.data && (
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-700">When</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">User</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Action</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Entity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {auditQuery.data.data.map((entry) => (
                <tr key={entry.id}>
                  <td className="px-4 py-3 text-gray-600">
                    {new Date(entry.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-gray-900">{entry.userEmail ?? '—'}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-800">{entry.action}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {entry.entityType}
                    {entry.entityId ? ` · ${entry.entityId.slice(0, 8)}…` : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
