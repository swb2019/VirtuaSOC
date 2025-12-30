import { randomUUID } from "node:crypto";

import type { Db } from "./db.js";

export async function writeAudit(
  db: Db,
  tenantId: string,
  action: string,
  actorUserId: string | null,
  targetType: string | null,
  targetId: string | null,
  metadata: Record<string, unknown> = {},
) {
  await db`
    INSERT INTO audit_log (id, tenant_id, action, actor_user_id, target_type, target_id, metadata)
    VALUES (
      ${randomUUID()},
      ${tenantId},
      ${action},
      ${actorUserId},
      ${targetType},
      ${targetId},
      ${db.json(metadata)}
    )
  `;
}



