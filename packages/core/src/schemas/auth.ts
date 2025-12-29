import { Type } from "@sinclair/typebox";

import { IsoDateTime, Uuid } from "./common.js";

export const UserRole = Type.Union(
  [
    Type.Literal("admin"),
    Type.Literal("gsoc_lead"),
    Type.Literal("gsoc_analyst"),
    Type.Literal("viewer"),
  ],
  { $id: "UserRole" },
);

export const UserSchema = Type.Object(
  {
    id: Uuid,
    tenantId: Uuid,
    createdAt: IsoDateTime,
    email: Type.String({ maxLength: 320 }),
    displayName: Type.String({ maxLength: 128 }),
    role: UserRole,
    passwordHash: Type.Optional(Type.String({ maxLength: 256 })),
  },
  { $id: "User", additionalProperties: false },
);

export const TenantSchema = Type.Object(
  {
    id: Uuid,
    createdAt: IsoDateTime,
    slug: Type.String({ maxLength: 32 }),
    name: Type.String({ maxLength: 128 }),
  },
  { $id: "Tenant", additionalProperties: false },
);
