import type { Db } from "../db.js";

export type RetentionCleanupJobPayload = {
  tenantId: string;
  days: number;
};

export async function runRetentionCleanup(db: Db, payload: RetentionCleanupJobPayload) {
  const days = Number.isFinite(payload.days) ? payload.days : 90;
  await db`
    DELETE FROM evidence_items
    WHERE tenant_id = ${payload.tenantId}
      AND created_at < NOW() - (${days}::text || ' days')::interval
  `;

  await db`
    DELETE FROM audit_log
    WHERE tenant_id = ${payload.tenantId}
      AND created_at < NOW() - (${days}::text || ' days')::interval
  `;
}
