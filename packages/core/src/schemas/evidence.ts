import { Type } from "@sinclair/typebox";

import { Handling, IsoDateTime, Uuid } from "./common.js";

export const EvidenceSourceType = Type.Union(
  [
    Type.Literal("url"),
    Type.Literal("rss"),
    Type.Literal("manual_upload"),
    Type.Literal("internal_system"),
    Type.Literal("email"),
  ],
  { $id: "EvidenceSourceType" },
);

export const EvidenceItemSchema = Type.Object(
  {
    id: Uuid,
    tenantId: Uuid,
    createdAt: IsoDateTime,
    fetchedAt: IsoDateTime,
    sourceType: EvidenceSourceType,
    sourceUri: Type.Optional(Type.String({ maxLength: 2048 })),
    title: Type.Optional(Type.String({ maxLength: 512 })),
    summary: Type.Optional(Type.String({ maxLength: 4000 })),
    contentText: Type.Optional(Type.String({ maxLength: 200000 })),
    contentHash: Type.Optional(Type.String({ maxLength: 128 })),
    handling: Type.Optional(Handling),
    tags: Type.Array(Type.String({ maxLength: 64 }), { default: [] }),
  },
  { $id: "EvidenceItem", additionalProperties: false },
);
