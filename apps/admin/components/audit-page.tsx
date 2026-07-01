'use client';

import { useQuery } from '@tanstack/react-query';
import {
  AdminPageBody,
  AdminPageHeader,
  AdminPageShell,
  AdminScrollCard,
} from '@/components/admin-ui';
import { listAuditLogs } from '@/lib/audit-api';

export function AuditPage() {
  const auditQuery = useQuery({
    queryKey: ['admin-audit'],
    queryFn: () => listAuditLogs(1, 50),
  });

  return (
    <AdminPageShell>
      <AdminPageHeader
        breadcrumb="Audit Log"
        title="Platform Audit"
        description="Recent admin actions across the platform."
        className="mb-stack-md shrink-0"
      />

      <AdminPageBody>
        <AdminScrollCard>
          {auditQuery.isLoading && (
            <p className="p-6 text-body-sm text-on-surface-variant">Loading audit entries…</p>
          )}
          {auditQuery.isError && (
            <p className="p-6 text-body-sm text-on-error-container">Failed to load audit log.</p>
          )}
          {auditQuery.data && (
            <table className="admin-table admin-table-sticky">
              <thead>
                <tr>
                  <th>When</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Entity</th>
                </tr>
              </thead>
              <tbody>
                {auditQuery.data.data.map((entry) => (
                  <tr key={entry.id}>
                    <td className="text-on-surface-variant">
                      {new Date(entry.createdAt).toLocaleString()}
                    </td>
                    <td>{entry.userEmail ?? '—'}</td>
                    <td className="font-mono text-xs">{entry.action}</td>
                    <td className="text-on-surface-variant">
                      {entry.entityType}
                      {entry.entityId ? ` · ${entry.entityId.slice(0, 8)}…` : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </AdminScrollCard>
      </AdminPageBody>
    </AdminPageShell>
  );
}
