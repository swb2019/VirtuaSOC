import { randomUUID } from "node:crypto";

import type { Db } from "./db.js";

export type PlatformAuditActor = {
  sub?: string;
  email?: string;
};

export async function writePlatformAudit(
  controlDb: Db,
  actor: PlatformAuditActor | null,
  action: string,
  targetType: string | null,
  targetId: string | null,
  metadata: Record<string, unknown> = {},
) {
  await controlDb`
    INSERT INTO platform_audit_log (id, actor_sub, actor_email, action, target_type, target_id, metadata)
    VALUES (
      ${randomUUID()},
      ${actor?.sub ?? null},
      ${actor?.email ?? null},
      ${action},
      ${targetType},
      ${targetId},
      ${controlDb.json(metadata)}
    )
  `;
}


