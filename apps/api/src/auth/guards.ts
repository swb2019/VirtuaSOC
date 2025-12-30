import type { FastifyReply, FastifyRequest } from "fastify";

export type UserRole = "viewer" | "gsoc_analyst" | "gsoc_lead" | "admin";

const roleRank: Record<UserRole, number> = {
  viewer: 0,
  gsoc_analyst: 1,
  gsoc_lead: 2,
  admin: 3,
};

export function getAuthUser(req: FastifyRequest): { sub: string; role: UserRole } | null {
  // OIDC mode
  // (req.authUser is added by authPlugin)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const u = (req as any).authUser as { sub: string; role: UserRole } | undefined;
  if (u?.sub && u?.role) return u;
  return null;
}

export function requireAuth(req: FastifyRequest, reply: FastifyReply) {
  const u = getAuthUser(req);
  if (!u) {
    reply.code(401).send({ error: "Unauthorized" });
    return null;
  }
  return u;
}

export function requireRole(req: FastifyRequest, reply: FastifyReply, minRole: UserRole) {
  const u = requireAuth(req, reply);
  if (!u) return null;
  const have = roleRank[u.role] ?? 0;
  const need = roleRank[minRole] ?? 0;
  if (have < need) {
    reply.code(403).send({ error: "Forbidden" });
    return null;
  }
  return u;
}


