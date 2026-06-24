export interface AuditLogResponse {
  id: string;
  userId: string | null;
  userEmail: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  payload: Record<string, unknown> | null;
  createdAt: Date;
}

export interface AuditLogListResponse {
  data: AuditLogResponse[];
  meta: { total: number; page: number; limit: number };
}
